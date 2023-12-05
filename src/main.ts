import './main.css';
import ScrollSnapper from './scroll-snapper';

const snappers = [];

document.querySelectorAll('.snap-slider').forEach((slider) => {
  snappers.push(new ScrollSnapper({ root: slider as HTMLDivElement }));
});

window.snappers = snappers;
