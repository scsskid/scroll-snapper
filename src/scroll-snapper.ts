export default class ScrollSnapper {
  private elements: {
    scrollContainer: HTMLElement;
    slides: NodeListOf<HTMLElement & { hasIntersected: boolean }>;
    previousButton?: HTMLButtonElement;
    nextButton?: HTMLButtonElement;
    debug?: HTMLElement;
  };
  private intersectionObserver: IntersectionObserver | null;
  public current: HTMLElement;
  private isFirst: boolean;
  private isLast: boolean;
  private intersectingLength: number;

  // constructor(element: HTMLDivElement) {
  constructor({ scrollContainer: element }: { scrollContainer: HTMLElement }) {
    this.elements = {
      scrollContainer: element,
      slides: element.querySelectorAll(':scope > *'),
      previousButton: undefined,
      nextButton: undefined,
      debug: undefined
    };
    this.current = this.elements.slides[0];
    this.intersectingLength = 0;
    this.intersectionObserver = null;
    this.isFirst = false;
    this.isLast = false;
    this.initState();
    this.createControls();
    this.createObservers();
    // this.createDebugger();
    this.listen();
  }

  private initState() {
    if (!this.elements.slides) return;
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
   * Listens to events
   * @returns void
   * @private
   */

  private listen() {
    if (!this.intersectionObserver) return;

    for (let item of this.elements.slides) {
      this.intersectionObserver.observe(item);
    }

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
    const next = this.current.nextElementSibling as HTMLDivElement;

    if (!next) {
      return;
    }

    this.goToElement(next);
  }

  goToPrevious() {
    const previous = this.current.previousElementSibling as HTMLDivElement;

    if (!previous) {
      return;
    }

    this.goToElement(previous);
  }

  goToElement(element: HTMLDivElement) {
    element.style.opacity = '0.5';
    setTimeout(() => {
      element.style.opacity = '1';
    }, 500);

    const scrollContainerPadding = parseInt(
      getComputedStyle(this.elements.scrollContainer).paddingLeft
    );

    const scrollContainerOffsetLeft = this.elements.scrollContainer.offsetLeft;

    // Account for offsetLeft and scrollContainerPadding when calculating the scrollTo position
    this.elements.scrollContainer.scrollTo({
      left:
        element.offsetLeft - scrollContainerOffsetLeft - scrollContainerPadding,
      behavior: 'smooth'
    });
  }

  /**
   * Synchronizes the state of the snapper
   * @returns void
   * @private
   *
   */
  private synchronize() {
    // set intersectingLength
    this.intersectingLength = [...this.elements.slides].filter(
      (slide) => slide.hasIntersected
    ).length;

    // set current to the first slide that hasIntersected
    this.current = [...this.elements.slides].find((slide) => {
      return slide.hasIntersected;
    })!;

    // set isFirst and isLast
    this.isFirst = this.current.dataset.index === '0';

    // isLast is true if the current slide index + the intersectingLength (aka visible slides)
    // is equal to the total number of slides
    this.isLast =
      this.intersectingLength + parseInt(this.current.dataset.index!) >=
      this.elements.slides.length;

    // hide or show buttons depending on snapper is at beginning or end
    if (this.isFirst) {
      this.elements.previousButton!.disabled = true;
    } else {
      this.elements.previousButton!.disabled = false;
    }

    if (this.isLast) {
      this.elements.nextButton!.disabled = true;
    } else {
      this.elements.nextButton!.disabled = false;
    }

    // refresh debug
    const debugObject = [...this.elements.slides].map((slide) => {
      return {
        index: slide.dataset.index,
        isIntersecting: slide.hasIntersected
      };
    });

    this.elements.debug!.innerHTML = `
			<pre style="font-size: .7rem">
				current: ${this.current.dataset.index}
				intersectingLength: ${this.intersectingLength}
		
				${JSON.stringify(debugObject, null, 2)}
			
			</pre>`;
  }

  /**
   * Creates a button element
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

  /**
   * Creates a visual debug element and appends it to the snapper-root element
   */
  private createDebugger() {
    let debug = document.createElement('div');
    debug.className = 'snap-slider__debug';
    debug.innerHTML = 'debug';
    this.elements.scrollContainer.after(debug);
    this.elements.debug = debug;
  }
}
