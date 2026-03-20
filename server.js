import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import * as crypto from "crypto";

const app = express();
const port = 7071;

// Настройка CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

let tickets = [
  {
    id: crypto.randomUUID(),
    name: "Поменять краску в принтере, ком. 404",
    description: "Принтер HP LJ-1210, картриджи на складе",
    status: false,
    created: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    name: "Переустановить Windows, ПК-Hall24",
    description: "",
    status: false,
    created: Date.now(),
  },
  {
    id: crypto.randomUUID(),
    name: "Установить обновление KB-31642dv3875",
    description: "Вышло критическое обновление для Windows",
    status: false,
    created: Date.now(),
  },
];

// Обработка favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Явная обработка OPTIONS для всех маршрутов
app.options('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// Основной обработчик для корневого пути
app.all('/', (req, res) => {
  const { method, id } = req.query;

  console.log(`Получен запрос: method=${method}, id=${id}, body=`, req.body);

  switch (method) {
    case "allTickets": {
      // Возвращаем тикеты без поля description согласно ТЗ
      const ticketsWithoutDescription = tickets.map(({ description, ...ticket }) => ticket);
      res.json(ticketsWithoutDescription);
      break;
    }

    case "ticketById": {
      const ticket = tickets.find(t => t.id === id);
      if (!ticket) {
        res.status(404).json({ message: "Ticket not found" });
        break;
      }
      res.json(ticket);
      break;
    }

    case "createTicket": {
      const { name, description } = req.body;
      const newTicket = {
        id: crypto.randomUUID(),
        name,
        description: description || "",
        status: false,
        created: Date.now(),
      };
      tickets.push(newTicket);
      res.json(newTicket);
      break;
    }

    case "deleteById": {
      tickets = tickets.filter(t => t.id !== id);
      res.status(204).end();
      break;
    }

    case "updateById": {
      const ticket = tickets.find(t => t.id === id);
      if (!ticket) {
        res.status(404).json({ message: "Ticket not found" });
        break;
      }
      Object.assign(ticket, req.body);
      res.json(ticket);
      break;
    }

    default:
      res.status(404).json({ message: `Unknown method: ${method}` });
  }
});

app.listen(port, () => {
  console.log(`✅ Server started on http://localhost:${port}`);
});