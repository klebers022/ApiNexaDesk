// Valores exclusivos do processo de testes. Nenhuma credencial real é usada.
process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/nexadesk_test";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
process.env.JWT_EXPIRES_IN = "1h";
