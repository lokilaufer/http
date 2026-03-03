export default class TicketService {
  constructor() {
    this.baseUrl = 'http://localhost:7071';
  }

  async request(method, params = {}, body = null) {
    let url = `${this.baseUrl}?method=${method}`;

    if (params.id) {
      url += `&id=${params.id}`;
    }

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'createTicket' || method === 'updateById') {
      options.method = 'POST';
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;

    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  list() {
    return this.request('allTickets');
  }

  get(id) {
    return this.request('ticketById', { id });
  }

  create(data) {
    return this.request('createTicket', {}, data);
  }

  update(id, data) {
    return this.request('updateById', { id }, data);
  }

  delete(id) {
    return this.request('deleteById', { id });
  }
}