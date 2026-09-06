const request = require('supertest');
const app = require('../src/app');

describe('Task API', () => {
  test('GET /health returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /tasks returns an array', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /tasks creates a new task', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Write README' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Write README');
    expect(res.body.done).toBe(false);
    expect(res.body.id).toBeDefined();
  });

  test('POST /tasks without title returns 400', async () => {
    const res = await request(app).post('/tasks').send({});
    expect(res.statusCode).toBe(400);
  });

  test('PUT /tasks/:id updates a task', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Temp task' });

    const res = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ done: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.done).toBe(true);
  });

  test('DELETE /tasks/:id removes a task', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Delete me' });

    const res = await request(app).delete(`/tasks/${created.body.id}`);
    expect(res.statusCode).toBe(204);

    const check = await request(app).get(`/tasks/${created.body.id}`);
    expect(check.statusCode).toBe(404);
  });
});
