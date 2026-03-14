// js/notifications.js
class NotificationManager {
  constructor() {
    this.container = document.getElementById('notificationContainer');
    this.notifications = [];
    this.defaultDuration = 5000; // 5 secondes
  }

  /**
   * Afficher une notification
   * @param {string} message - Message principal
   * @param {string} type - Type: 'success', 'error', 'warning', 'info'
   * @param {string} title - Titre (optionnel)
   * @param {number} duration - Durée en ms (optionnel)
   */
  show(message, type = 'info', title = '', duration = this.defaultDuration) {
    const id = 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Définir les titres par défaut selon le type
    const titles = {
      success: 'Succès',
      error: 'Erreur',
      warning: 'Attention',
      info: 'Information'
    };
    
    const notificationTitle = title || titles[type] || 'Information';
    
    // Icônes selon le type
    const icons = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.id = id;
    notification.setAttribute('role', 'alert');
    
    notification.innerHTML = `
      <div class="notification-icon">
        <span class="material-symbols-rounded">${icons[type]}</span>
      </div>
      <div class="notification-content">
        <div class="notification-title">${notificationTitle}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close" onclick="notifications.close('${id}')">
        <span class="material-symbols-rounded">close</span>
      </button>
    `;
    
    // Ajouter au container
    this.container.appendChild(notification);
    
    // Force reflow pour permettre l'animation
    notification.offsetHeight;
    
    // Afficher avec animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Stocker la notification
    this.notifications.push({
      id,
      element: notification,
      timeout: setTimeout(() => this.close(id), duration)
    });
    
    return id;
  }

  /**
   * Fermer une notification
   * @param {string} id - ID de la notification
   */
  close(id) {
    const notification = this.notifications.find(n => n.id === id);
    
    if (notification) {
      // Clear le timeout
      clearTimeout(notification.timeout);
      
      // Ajouter la classe de sortie
      notification.element.classList.add('removing');
      notification.element.classList.remove('show');
      
      // Supprimer après l'animation
      setTimeout(() => {
        if (notification.element.parentNode) {
          notification.element.remove();
        }
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 300);
    }
  }

  /**
   * Fermer toutes les notifications
   */
  closeAll() {
    this.notifications.forEach(notification => {
      this.close(notification.id);
    });
  }

  /**
   * Méthodes raccourcies
   */
  success(message, title = '', duration = this.defaultDuration) {
    return this.show(message, 'success', title, duration);
  }

  error(message, title = '', duration = this.defaultDuration) {
    return this.show(message, 'error', title, duration);
  }

  warning(message, title = '', duration = this.defaultDuration) {
    return this.show(message, 'warning', title, duration);
  }

  info(message, title = '', duration = this.defaultDuration) {
    return this.show(message, 'info', title, duration);
  }
}

// Initialiser le gestionnaire de notifications
const notifications = new NotificationManager();

// Rendre accessible globalement
window.notifications = notifications;

/*
// Notification simple
notifications.show('Opération réussie !', 'success');

// Avec titre personnalisé
notifications.show('La parcelle a été modifiée avec succès', 'success', 'Parcelle modifiée');

// Notification d'erreur
notifications.show('Impossible de charger les données', 'error', 'Erreur de connexion');

// Notification d'information
notifications.info('Mise à jour disponible', 'Nouvelle version');

// Notification avec durée personnalisée (10 secondes)
notifications.warning('Cette action est irréversible', 'Attention', 10000);

// Utilisation dans vos fonctions existantes
async function saveIlot() {
  try {
    // Votre code de sauvegarde...
    notifications.success('Îlot enregistré avec succès');
  } catch (error) {
    notifications.error('Erreur lors de la sauvegarde: ' + error.message);
  }
}

// Lors de l'ajout d'une section
function addSection() {
  // Validation...
  if (!sectionCode) {
    notifications.warning('Veuillez remplir tous les champs obligatoires');
    return;
  }
  
  // Succès
  notifications.show('Section créée avec succès', 'success', 'Nouvelle section');
}


======================================================
SELECT setval(
  pg_get_serial_sequence('abc_ilot', 'fid'),
  (SELECT MAX(fid) FROM abc_ilot)
);
*/
