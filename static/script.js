/**
 * Pexels Image Explorer - Frontend Script
 *
 * This script handles user interactions for the Pexels Image Explorer.
 * It listens for search form submissions, sends requests to the backend API,
 * and dynamically populates the image gallery with the results. It also
 * manages loading and error states for a smooth user experience.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const imageGallery = document.getElementById('image-gallery');
    const loader = document.getElementById('loader');

    // --- Event Listeners ---
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    } else {
        console.error('Error: Search form element with id "search-form" not found.');
    }

    /**
     * Handles the form submission event to search for images.
     * @param {Event} event - The form submission event.
     */
    async function handleSearch(event) {
        event.preventDefault(); // Prevent the default form submission (page reload)
        const query = searchInput.value.trim();

        if (!query) {
            displayMessage('Please enter a search term.');
            return;
        }

        // Prepare UI for a new search
        clearGallery();
        showLoader();

        try {
            // Fetch images from our backend server
            const photos = await fetchImages(query);
            hideLoader();

            if (photos && photos.length > 0) {
                renderImages(photos);
            } else {
                displayMessage('No images found. Try a different search term.');
            }
        } catch (error) {
            console.error('Failed to fetch and display images:', error);
            hideLoader();
            displayMessage('An error occurred while fetching images. Please try again later.');
        }
    }

    /**
     * Fetches image data from the backend API.
     * @param {string} query - The search term.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of photo objects.
     */
    async function fetchImages(query) {
        // The backend endpoint that proxies requests to the Pexels API
        const apiUrl = `/api/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            // Handle server-side errors (e.g., 500, 404)
            const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.photos;
    }

    /**
     * Renders an array of photo objects into the image gallery.
     * @param {Array<Object>} photos - The array of photo objects from the API.
     */
    function renderImages(photos) {
        const fragment = document.createDocumentFragment(); // Use a fragment for performance

        photos.forEach(photo => {
            // Create the main container for the image and its info
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';

            // Create the image element
            const img = document.createElement('img');
            img.src = photo.src.large; // Use the 'large' version for good quality
            img.alt = photo.alt || `A photo by ${photo.photographer}`; // Accessibility best practice
            img.loading = 'lazy'; // Improve performance with native lazy loading

            // Create an overlay with photographer info and a link to Pexels
            const overlay = document.createElement('a');
            overlay.className = 'overlay';
            overlay.href = photo.url;
            overlay.target = '_blank';
            overlay.rel = 'noopener noreferrer'; // Security best practice for external links

            const photographerInfo = document.createElement('p');
            photographerInfo.innerHTML = `
                <i class="fas fa-camera"></i> ${photo.photographer}
            `;

            overlay.appendChild(photographerInfo);
            galleryItem.appendChild(img);
            galleryItem.appendChild(overlay);

            fragment.appendChild(galleryItem);
        });

        imageGallery.appendChild(fragment);
    }

    // --- UI Helper Functions ---

    /**
     * Displays a message in the gallery container (e.g., for errors or no results).
     * @param {string} message - The message to be displayed.
     */
    function displayMessage(message) {
        clearGallery();
        const messageElement = document.createElement('p');
        messageElement.className = 'message';
        messageElement.textContent = message;
        imageGallery.appendChild(messageElement);
    }

    /**
     * Clears all content from the image gallery.
     */
    function clearGallery() {
        imageGallery.innerHTML = '';
    }

    /**
     * Shows the loading spinner.
     */
    function showLoader() {
        if (loader) {
            loader.style.display = 'block';
        }
    }

    /**
     * Hides the loading spinner.
     */
    function hideLoader() {
        if (loader) {
            loader.style.display = 'none';
        }
    }
});