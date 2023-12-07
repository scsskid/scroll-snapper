type ScrollSnapperElements = {
	scrollContainer: HTMLElement;
	slides: NodeListOf<HTMLElement & { hasIntersected: boolean }>;
	previousButton?: HTMLButtonElement;
	nextButton?: HTMLButtonElement;
	debug?: HTMLElement;
};

type ScrollSnapperState = {
	currentElement: HTMLElement;
	isFirst: boolean;
	isLast: boolean;
	intersectingLength: number;
	options?: {
		scrollBy: number;
	};
};

export default class ScrollSnapper {
	elements: ScrollSnapperElements;
	state: ScrollSnapperState;

	private intersectionObserver: IntersectionObserver | null;

	constructor({ scrollContainer: element }: { scrollContainer: HTMLElement }) {
		this.elements = {
			scrollContainer: element,
			slides: element.querySelectorAll(':scope > *'),
			previousButton: undefined,
			nextButton: undefined,
			debug: undefined
		};

		this.state = {
			currentElement: this.elements.slides[0],
			isFirst: false,
			isLast: false,
			intersectingLength: 0,
			options: {
				// get scrollBy from css variable or use 1 as default
				scrollBy: parseInt(getCssVariableValue(element, '--scroll-by')) || 1
			}
		};

		this.intersectionObserver = null;

		this.initState();
		this.createControls();
		this.createDotNav();
		this.createObservers();
		this.listen();
		// this.createDebugger();
	}

	/**
	 * @description Sets the initial state of the snapper: sets all slides to hasIntersected: false and adds data-index attribute
	 * @returns void
	 */
	private initState() {
		if (!this.elements.slides) return;

		// set all slides to hasIntersected: false and add data-index attribute
		this.elements.slides.forEach((slide, index) => {
			slide.hasIntersected = false;
			slide.setAttribute('data-index', index.toString());
		});
	}

	private createControls() {
		let controls = document.createElement('div');
		controls.className = 'snap-slider__controls';
		let prevButton = this.createButton('previous');
		let nextButton = this.createButton('next');

		controls.appendChild(prevButton);
		controls.appendChild(nextButton);

		this.elements.previousButton = prevButton;
		this.elements.nextButton = nextButton;

		this.elements.scrollContainer.before(controls);
	}

	/**
	 * @description Creates the dot nav and inserts it after the snapper-root element
	 */

	private createDotNav() {
		let dotNav = document.createElement('div');
		dotNav.className = 'snap-slider__dot-nav';

		this.elements.slides.forEach((slide) => {
			let dot = document.createElement('button');
			dot.className = 'snap-slider__dot';
			dot.innerHTML = String(parseInt(slide.dataset.index!) + 1);
			dot.addEventListener('click', () => {
				this.goToElement(slide);
			});
			dot.title = `Go to slide ${slide.dataset.index!}`;
			dot.dataset.index = slide.dataset.index;
			dotNav.appendChild(dot);
		});

		this.elements.scrollContainer.after(dotNav);
	}

	/**
	 * @description Creates the intersection observer
	 * @returns void
	 * @private
	 */

	private createObservers() {
		// the oberver callback adds the isIntersecting property of the observer entry
		// to the this.elements.slide[n]
		const oberverCallback = (entries: IntersectionObserverEntry[]) => {
			// point all slide.hasIntersected to observerEntry.isIntersecting
			for (let entry of entries) {
				[...this.elements.slides].forEach((slide) => {
					if (slide === entry.target) {
						slide.hasIntersected = entry.isIntersecting;
					}
				});

				entry.target.classList.toggle('--intersecting', entry.isIntersecting);
			}

			this.synchronize();
		};

		// create the observer and assign it to this.intersectionObserver
		this.intersectionObserver = new IntersectionObserver(oberverCallback, {
			root: this.elements.scrollContainer,
			rootMargin: '0px',
			threshold: 0.5
		});
	}

	/**
	 * @description Sets items to observe and adds event listeners to buttons
	 * @returns void
	 * @private
	 */

	private listen() {
		if (!this.intersectionObserver) return;

		// start observing all slides
		for (let item of this.elements.slides) {
			this.intersectionObserver.observe(item);
		}

		// listen to previous and next button clicks
		this.elements.previousButton?.addEventListener(
			'click',
			this.goToPrevious.bind(this)
		);
		this.elements.nextButton?.addEventListener(
			'click',
			this.goToNext.bind(this)
		);
	}

	goToNext() {
		// determine next slide
		const nextIndex =
			parseInt(this.state.currentElement.dataset.index!) +
			this.state.options!.scrollBy;
		const nextElement = this.elements.slides[nextIndex];

		if (!nextElement) {
			return;
		}

		// go to next slide
		this.goToElement(nextElement);
	}

	goToPrevious() {
		// determine previous slide
		const prevIndex =
			parseInt(this.state.currentElement.dataset.index!) -
			this.state.options!.scrollBy;

		// prevent going to negative index
		const prevElement = this.elements.slides[prevIndex < 0 ? 0 : prevIndex];

		if (!prevElement) {
			return;
		}

		// go to previous slide
		this.goToElement(prevElement);
	}

	goToElement(element: HTMLElement) {
		// flash element to go to
		flashElement(element);

		// scroll to element only horizontally
		element.scrollIntoView({
			behavior: 'smooth',
			block: 'nearest',
			inline: 'start'
		});
	}

	/**
	 * Synchronizes the state of the snapper
	 * @returns void
	 * @private
	 *
	 */
	private synchronize() {
		// update intersectingLength
		this.state.intersectingLength = [...this.elements.slides].filter(
			(slide) => slide.hasIntersected
		).length;

		// set current to the first slide that has intersected
		this.state.currentElement = [...this.elements.slides].find((slide) => {
			return slide.hasIntersected;
		})!;

		// bail if current is undefined (can happen in single slide mode)
		// prevent error when current is undefined when accessing dataset
		if (!this.state.currentElement) return;

		// set isFirst and isLast
		this.state.isFirst = this.state.currentElement.dataset.index === '0';

		// isLast is true if the current slide index + the intersectingLength (aka visible slides)
		// is equal or greater to the total number of slides
		this.state.isLast =
			this.state.intersectingLength +
				parseInt(this.state.currentElement.dataset.index!) >=
			this.elements.slides.length;

		// hide or show buttons depending on snapper is at beginning or end
		if (this.state.isFirst) {
			this.elements.previousButton!.disabled = true;
		} else {
			this.elements.previousButton!.disabled = false;
		}

		if (this.state.isLast) {
			this.elements.nextButton!.disabled = true;
		} else {
			this.elements.nextButton!.disabled = false;
		}

		// refresh debug
		// this.updateDebugger();
		this.updateDotNav();
	}

	/**
	 * Updates the dot nav
	 */
	private updateDotNav() {
		const dotNav = this.elements.scrollContainer.parentElement!.querySelector(
			'.snap-slider__dot-nav'
		)!;
		const dots = dotNav.querySelectorAll('.snap-slider__dot');

		dots.forEach((dot) => {
			dot.classList.remove('--current');
		});

		const currentDot = dotNav.querySelector(
			`.snap-slider__dot[data-index="${this.state.currentElement.dataset.index}"]`
		);

		currentDot?.classList.add('--current');
	}

	/**
	 * @description Creates a button element
	 * @param type "previous" | "next"
	 * @returns HTMLButtonElement
	 */
	private createButton(type: 'previous' | 'next') {
		let button = document.createElement('button');
		button.type = 'button';
		button.className = `snap-slider__control --${type}`;
		button.title = type;
		button.innerHTML = type;

		return button;
	}

	// 	/**
	// 	 * Creates a visual debug element and appends it to the snapper-root element
	// 	 */
	// 	private createDebugger() {
	// 		let debug = document.createElement('div');
	// 		debug.className = 'snap-slider__debug';
	// 		debug.innerHTML = 'debug';
	// 		this.elements.scrollContainer.after(debug);
	// 		this.elements.debug = debug;
	// 	}

	// 	/**
	// 	 * Updates the debug element
	// 	 */
	// 	private updateDebugger() {
	// 		const debugObject = [...this.elements.slides].map((slide) => {
	// 			return {
	// 				index: slide.dataset.index,
	// 				isIntersecting: slide.hasIntersected
	// 			};
	// 		});

	// 		this.elements.debug!.innerHTML = `
	// 			<pre style="font-size: .7rem">
	// current: ${this.state.currentElement.dataset.index}
	// intersectingLength: ${this.intersectingLength}

	// ${JSON.stringify(debugObject, null, 2)}

	// 			</pre>`;
	// 	}
}

function flashElement(element: HTMLElement) {
	element.style.opacity = '0.5';
	setTimeout(() => {
		element.style.opacity = '1';
	}, 500);
}

function getCssVariableValue(element: HTMLElement, variableName: string) {
	return getComputedStyle(element).getPropertyValue(variableName);
}
