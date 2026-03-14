const fileInput = document.getElementById("file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.getElementById("cancel-file");
// Éléments UI (exemple, adaptez vos sélectors)
const submitButton = document.getElementById('.generate-btn');
const statusElement = document.getElementById('status');

// 1. Structure de données avec état de chargement
const userData = {
  message: null,
  file: { data: null, mime_type: null },
  isLoading: false  // Pour gérer l'état UI
};


// 2. Constants pour la configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// 3. Gestion du fichier avec validation
fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  // Validation
  if (file.size > MAX_FILE_SIZE) {
    alert(`Fichier trop volumineux (max ${MAX_FILE_SIZE/1024/1024}MB)`);
    resetFileInput();
    return;
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    alert('Format non supporté. Utilisez JPEG, PNG, GIF ou WebP.');
    resetFileInput();
    return;
  }

  // Afficher l'aperçu (votre code actuel)
  const reader = new FileReader();
  reader.onload = (e) => {
    fileUploadWrapper.querySelector('img').src = e.target.result;
    fileUploadWrapper.classList.add('file-uploaded');
    
    // Pour OpenAI Vision : on garde en base64
    const base64String = e.target.result.split(',')[1];
    userData.file = { data: base64String, mime_type: file.type };
    fileInput.value = '';
  };
  reader.readAsDataURL(file);
});

// 4. Fonction d'envoi avec gestion d'état
async function sendToBackend() {
  if (userData.isLoading) return;
  
  // Validation finale
  if (!promptInput.value.trim() && !userData.file.data) {
    alert('Veuillez entrer un message ou sélectionner une image');
    return;
  }

  // Mettre à jour l'UI
  userData.isLoading = true;
  submitButton.disabled = true;
  statusElement.textContent = 'Génération en cours...';

  try {
    const response = await fetch('/api/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: promptInput.value.trim(),
        file: userData.file.data ? userData.file : null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Erreur ${response.status}`);
    }

    const result = await response.json();
    
    // Traiter la réponse (à adapter selon votre besoin)
    if (result.post) {
      // Afficher le résultat dans votre interface
      console.log('Post généré:', result.post);
      statusElement.textContent = 'Succès !';
    }
    
  } catch (error) {
    console.error('Erreur:', error);
    statusElement.textContent = `Erreur: ${error.message}`;
  } finally {
    userData.isLoading = false;
    submitButton.disabled = false;
  }
}

// 5. Utilitaires
function resetFileInput() {
  fileInput.value = '';
  userData.file = { data: null, mime_type: null };
  fileUploadWrapper.classList.remove('file-uploaded');
}

// 6. Événement de soumission (adaptez votre déclencheur)
document.getElementById('generateButton').addEventListener('click', sendToBackend);






//==================================================================





const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(number);
  const scaleFactor = baseSize / Math.sqrt(width * height);

  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);

  //ensure dimensions are multiples of 16 ( AI model requirements)
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

  return { width: calculatedWidth, height: calculatedHeight };
};

const generateImages = async (
  selectedModel,
  imageCount,
  aspectRatio,
  promptText
) => {
  const MODEL_URL = `https//api-inference.huggingface.co/models/${selectedModel}`;
  const { width, height } = getImageDimensions(aspectRatio);

  //Create an array oh image generation promises
  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    try {
      const response = await fetch(MODEL_URL, {
        hearders: {
          Authorization: `Bearer ${API_KAY}`,
          "Content-type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: promptText,
          parameters: { width, height },
          options: { wait_for_model: true, user_cache: false },
        }),
      });

      if (!response.ok) throw new Error((await response.json())?.error);

      const result = await response.blob();
      console.log(result);
    } catch (error) {
      console.log(error);
    }
  });

  await Promise.allSettled(imagePromises);
};

//creation des cartes de publications
createCartePub = (imageCount, promptText) => {
  carrouselTrack.innerHTML = "";

  for (let i = 0; i < imageCount; i++) {
    carrouselTrack.innerHTML += `<div class="card swiper-slide">
                  <div class="card-image">
                    <img src="assets/Image-test.png" alt="" />
                  </div>
                  <div class="card-content">
                    <h3 class="card-title">Best Frontend framwork</h3>
                    <p class="card-text">
                      Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                      Numquam, nesciunt dignissimos.
                    </p>
                    <div class="card-footer">
                      <div class="card-profile">
                        <img src="assets/Image-test.png" alt="" />
                        <div class="card-profile-info">
                          <span class="card-profile-name">Jessica chen</span>
                          <span class="card-profile-role">Developper</span>
                        </div>
                      </div>
                      <a href="" class="card-button">Enregistrer</a>
                    </div>
                  </div>
                </div>`;
  }
};

// creation des cartes d'images
const createImageCards = (
  selectedModel,
  imageCount,
  aspectRatio,
  promptText
) => {
  gridGallery.innerHTML = "";

  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `<div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
                  <div class="status-container">
                    <div class="spinner"></div>
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p class="status-text">Génération...</p>
                  </div>
                  <img src="Image-test.png" class="result-img" />
                </div>`;
  }

  generateImages(selectedModel, imageCount, aspectRatio, promptText);

  //generateTextPublication(selectedModel, imageCount, aspectRatio, promptText); la fonction pour la génération du text de publication
};

handleFormSubmit = (e) => {
  e.preventDefault();

  const selectedModel = modelSelect.value;
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";

  const promptText = promptInput.value.trim();

  createImageCards(selectedModel, imageCount, aspectRatio, promptText);
  createCartePub(imageCount, promptText);
};
