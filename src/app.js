const express = require('express');
const { randomUUID } = require('crypto');

const app = express();
app.use(express.json());

// In-memory "database" — resets whenever the app restarts.
// Good enough for a demo project; swap for a real DB later if you want to extend this.
let tasks = [
  { id: randomUUID(), title: 'Learn Docker', done: false },
  { id: randomUUID(), title: 'Set up CI/CD pipeline', done: false }
];

// Health check — used by Docker/Render/monitoring to confirm the app is alive
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Root route — just a friendly landing message
app.get('/', (req, res) => {
  res.json({ message: 'Task API is running. Try GET /tasks' });
});

// Get all tasks
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// Get single task
app.get('/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// Create a task
app.post('/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required and must be a string' });
  }
  const newTask = { id: randomUUID(), title, done: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Update a task (mark done / rename)
app.put('/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, done } = req.body;
  if (title !== undefined) task.title = title;
  if (done !== undefined) task.done = done;

  res.json(task);
});

// Delete a task
app.delete('/tasks/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });

  tasks.splice(index, 1);
  res.status(204).send();
});

module.exports = app;
