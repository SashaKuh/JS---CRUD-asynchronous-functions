import axios from 'axios';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

const elements = {
  form: document.querySelector('.js-search-form'),
  gallery: document.querySelector('.gallery'),
  loadMore: document.querySelector('.js-load-more'),
  loader: document.querySelector('.loader'),
  scrollProgress: document.querySelector('#progress'),
  progressValue: document.querySelector('#progress-value')
};

//------------ API --------------------------------
const TOKEN = '38508904-d7c593c5c9487e629ee3cdcfc';
axios.defaults.baseURL = `https://pixabay.com/api/`;

export async function searchByQuery(query, page) {
  return axios.get(`?key=${TOKEN}&q=${query}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=40`);
};
//-------------------------------------------------

let counter = 1;
let searchQuery = '';

elements.form.addEventListener('submit', onSearch);
elements.loadMore.addEventListener('click', onLoadMore);

const options = {
  rootMargin: '0px',
  threshold: 1.0
}

const observer = new IntersectionObserver(onLoadMore, options);
const lightbox = new SimpleLightbox('.gallery a', { showCounter: false });

async function onSearch(evt) {
  evt.preventDefault();
  observer.unobserve(elements.loadMore);
  searchQuery = evt.currentTarget.searchQuery.value.split(' ').join('+');
  counter = 1;
  elements.gallery.innerHTML = '';

  try {
    elements.loader.style.display = 'inline-block';
    const resp = await searchByQuery(searchQuery, counter);
    const totalHits = resp.data.totalHits;

    if (!totalHits) {
      throw new Error('Sorry, there are no images matching your search query. Please try again.');
    }

    Notify.info(`Hooray! We found ${totalHits} images.`);

    const cardsMarkup = resp.data.hits.map(createCardMarkup).join('');
    elements.gallery.insertAdjacentHTML('beforeend', cardsMarkup);

    lightbox.refresh();
  } catch (err) {
    Notify.warning(err.message);
    elements.loader.style.display = 'none';
    return;
  }

  elements.loader.style.display = 'none';
  counter = 1;
  observer.observe(elements.loadMore);
}

async function onLoadMore(entries) {
  if (entries[0].intersectionRatio <= 0) return;
  counter += 1;
  elements.loadMore.style.display = 'none';

  try {
    elements.loader.style.display = 'inline-block';
    const resp = await searchByQuery(searchQuery, counter);
    const cardsMarkup = resp.data.hits.map(createCardMarkup).join('');
    elements.gallery.insertAdjacentHTML('beforeend', cardsMarkup);
    elements.loadMore.style.display = 'block';

    if (counter * 40 >= resp.data.totalHits) {
      throw new Error(`We're sorry, but you've reached the end of search results.`);
    }
  } catch (err) {
    Notify.warning(`${err.message}`);
    observer.unobserve(entries[0].target);
    elements.loader.style.display = 'none';
    elements.loadMore.style.display = 'block';
    return;
  }

  lightbox.refresh();
  smoothScroll();
}

function createCardMarkup({ webformatURL, tags, likes, views, comments, downloads, largeImageURL }) {
  return `<a href="${largeImageURL}" class="photo-card">
    <div class="img-container"><img class="card-img" src="${webformatURL}" alt="${tags}" loading="lazy" /></div>
    <div class="info">
      <p class="item">
        <b>Likes</b> <span class="text-number">${likes}</span>
      </p>
      <p class="item">
        <b>Views</b> <span class="text-number">${views}</span>
      </p>
      <p class="item">
        <b>Comments</b> <span class="text-number">${comments}</span>
      </p>
      <p class="item">
        <b>Downloads</b> <span class="text-number">${downloads}</span>
      </p>
    </div>
  </a>`;
}

function smoothScroll() {
  const { height: cardHeight } = document.querySelector(".gallery").firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight,
    behavior: "smooth",
  });
}
// ---------- To-top --------------------------------------
const calcScrollValue = () => {
  const pos = document.documentElement.scrollTop;
  

  if (pos > 100) {
    elements.scrollProgress.style.display = "grid";
  } else {
    elements.scrollProgress.style.display = "none";
  }

  elements.scrollProgress.addEventListener("click", () => {
    document.documentElement.scrollTop = 0;
  });

};

window.onscroll = calcScrollValue;
window.onload = function () {
  calcScrollValue();
};
