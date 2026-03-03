import './style.css';
import TicketService from './api.js';

class HelpDesk {
  constructor() {
    this.api = new TicketService();
    this.tickets = [];
    this.currentEditId = null;
    this.currentDeleteId = null;
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.addEventListeners();
    this.loadTickets();
  }

  cacheElements() {
    this.ticketsList = document.querySelector('.tickets-list');
    this.loader = document.querySelector('.loader');
    this.modalOverlay = document.querySelector('.modal-overlay');
    this.modal = document.querySelector('.modal');
    this.modalConfirm = document.querySelector('.modal-confirm');
    this.modalTitle = document.querySelector('.modal-title');
    this.modalForm = document.querySelector('.modal-form');
    this.inputName = document.querySelector('.input-name');
    this.inputDesc = document.querySelector('.input-desc');
    this.cancelBtns = document.querySelectorAll('.cancel-btn');
    this.addBtn = document.querySelector('.add-ticket-btn');
    this.confirmDeleteBtn = document.querySelector('.modal-confirm .ok-btn');
  }

  addEventListeners() {
    // Добавление тикета
    this.addBtn.addEventListener('click', () => this.openAddModal());

    // Отмена в модальных окнах
    this.cancelBtns.forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Закрытие по оверлею
    this.modalOverlay.addEventListener('click', () => this.closeAllModals());

    // Сохранение формы
    this.modalForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

    // Подтверждение удаления
    this.confirmDeleteBtn.addEventListener('click', () => this.handleDelete());
  }

  async loadTickets() {
    this.showLoader();
    try {
      this.tickets = await this.api.list();
      this.renderTickets();
    } catch (error) {
      console.error('Failed to load tickets:', error);
      this.ticketsList.innerHTML = '<div class="error">Ошибка загрузки. Убедитесь, что сервер запущен на порту 7070</div>';
    } finally {
      this.hideLoader();
    }
  }

  renderTickets() {
    if (this.tickets.length === 0) {
      this.ticketsList.innerHTML = '<div class="empty">Нет тикетов</div>';
      return;
    }

    this.ticketsList.innerHTML = this.tickets.map(ticket => this.renderTicket(ticket)).join('');
    
    // Добавляем обработчики после рендера
    this.tickets.forEach(ticket => {
      const ticketEl = document.querySelector(`[data-id="${ticket.id}"]`);
      if (!ticketEl) return;

      // Статус
      const statusBtn = ticketEl.querySelector('.ticket-status');
      statusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleStatus(ticket.id, !ticket.status);
      });

      // Редактирование
      const editBtn = ticketEl.querySelector('.edit-btn');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEditModal(ticket.id);
      });

      // Удаление
      const deleteBtn = ticketEl.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openDeleteModal(ticket.id);
      });

      // Клик по телу тикета
      ticketEl.addEventListener('click', () => this.toggleDescription(ticket.id));
    });
  }

  renderTicket(ticket) {
    const date = new Date(ticket.created);
    const formattedDate = `${date.getDate().toString().padStart(2,'0')}.${(date.getMonth()+1).toString().padStart(2,'0')}.${date.getFullYear().toString().slice(2)} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
    
    return `
      <div class="ticket" data-id="${ticket.id}">
        <div class="ticket-status ${ticket.status ? 'completed' : ''}"></div>
        <div class="ticket-content">
          <div class="ticket-header">
            <span class="ticket-name">${this.escapeHtml(ticket.name)}</span>
            <span class="ticket-date">${formattedDate}</span>
          </div>
          <div class="ticket-description hidden">${this.escapeHtml(ticket.description || '')}</div>
        </div>
        <div class="ticket-actions">
          <button class="btn-icon edit-btn" title="Редактировать">✎</button>
          <button class="btn-icon delete-btn" title="Удалить">×</button>
        </div>
      </div>
    `;
  }

  // Защита от XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async toggleStatus(id, status) {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) return;

    try {
      await this.api.update(id, { ...ticket, status });
      await this.loadTickets(); // Перезагружаем список
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('Ошибка при изменении статуса');
    }
  }

  async toggleDescription(id) {
    const ticketEl = document.querySelector(`[data-id="${id}"]`);
    const descEl = ticketEl.querySelector('.ticket-description');
    
    if (descEl.classList.contains('visible')) {
      descEl.classList.remove('visible');
      return;
    }

    // Если описания нет в DOM, загружаем с сервера
    if (!ticketEl._fullTicket) {
      try {
        const fullTicket = await this.api.get(id);
        ticketEl._fullTicket = fullTicket;
        descEl.textContent = fullTicket.description || '';
      } catch (error) {
        console.error('Failed to load ticket details:', error);
        alert('Ошибка при загрузке описания');
        return;
      }
    }
    
    descEl.classList.add('visible');
  }

  openAddModal() {
    this.modalTitle.textContent = 'Добавить тикет';
    this.inputName.value = '';
    this.inputDesc.value = '';
    this.currentEditId = null;
    this.modal.classList.remove('hidden');
    this.modalOverlay.classList.remove('hidden');
  }

  async openEditModal(id) {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) return;

    try {
      // Загружаем полное описание
      const fullTicket = await this.api.get(id);
      this.modalTitle.textContent = 'Изменить тикет';
      this.inputName.value = fullTicket.name;
      this.inputDesc.value = fullTicket.description || '';
      this.currentEditId = id;
      this.modal.classList.remove('hidden');
      this.modalOverlay.classList.remove('hidden');
    } catch (error) {
      console.error('Failed to load ticket for edit:', error);
      alert('Ошибка при загрузке данных тикета');
    }
  }

  openDeleteModal(id) {
    this.currentDeleteId = id;
    this.modalConfirm.classList.remove('hidden');
    this.modalOverlay.classList.remove('hidden');
  }

  closeAllModals() {
    this.modal.classList.add('hidden');
    this.modalConfirm.classList.add('hidden');
    this.modalOverlay.classList.add('hidden');
    this.currentEditId = null;
    this.currentDeleteId = null;
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    
    const data = {
      name: this.inputName.value.trim(),
      description: this.inputDesc.value.trim()
    };

    if (!data.name) {
      alert('Краткое описание обязательно');
      return;
    }

    try {
      if (this.currentEditId) {
        // Обновление
        const existing = this.tickets.find(t => t.id === this.currentEditId);
        await this.api.update(this.currentEditId, { ...existing, ...data });
      } else {
        // Создание
        await this.api.create({ ...data, status: false });
      }
      
      this.closeAllModals();
      await this.loadTickets();
    } catch (error) {
      console.error('Failed to save ticket:', error);
      alert('Ошибка сохранения');
    }
  }

  async handleDelete() {
    if (!this.currentDeleteId) return;

    try {
      await this.api.delete(this.currentDeleteId);
      this.closeAllModals();
      await this.loadTickets();
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      alert('Ошибка удаления');
    }
  }

  showLoader() {
    if (this.loader) {
      this.loader.classList.remove('hidden');
    }
  }

  hideLoader() {
    if (this.loader) {
      this.loader.classList.add('hidden');
    }
  }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
  new HelpDesk();
});