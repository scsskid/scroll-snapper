import './main.css';
import ScrollSnapper from './scroll-snapper';

const snappers = [] as ScrollSnapper[];

document.querySelectorAll('[data-snap-slider]').forEach((slider) => {
  snappers.push(
    new ScrollSnapper({
      scrollContainer: slider as HTMLElement
    })
  );
});
