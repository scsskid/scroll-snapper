import './main.css';
import ScrollSnapper from './scroll-snapper';

const snapper1 = new ScrollSnapper(document.querySelector('.snap-slider--1')!);
const snapper2 = new ScrollSnapper(document.querySelector('.snap-slider--2')!);

window.snapper1 = snapper1;
window.snapper2 = snapper2;
