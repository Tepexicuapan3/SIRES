-- =====================================================
-- Migration 006: Cleanup MySQL OTP Table
-- =====================================================
-- Fecha: 2026-01-05
-- Descripción: Elimina tabla codigos_otp que fue migrada a Redis
--
-- Contexto:
--   - El sistema de OTP fue migrado completamente a Redis
--   - OTPService (Redis) reemplaza a PasswordResetRepository (MySQL)
--   - Esta tabla ya no se usa en el código
--
-- Referencias:
--   - backend/src/use_cases/auth/otp_service.py (Redis)
--   - docs/architecture/otp-redis.md
-- =====================================================

USE dbsisem;

-- Eliminar tabla de OTP en MySQL (migrada a Redis)
-- Verifica primero si existe para evitar errores
DROP TABLE IF EXISTS `redis`.`codigos_otp`;

-- Opcional: Eliminar schema redis si estaba dedicado solo a OTP
-- DROP SCHEMA IF EXISTS `redis`;
-- ⚠️ Comentado por seguridad - verificar antes si hay otras tablas

-- =====================================================
-- Verificación Post-Migración
-- =====================================================
-- Después de ejecutar esta migración, verificar:
--
-- 1. Redis está funcionando:
--    docker-compose ps | grep redis
--
-- 2. OTPService funciona:
--    redis-cli
--    > KEYS otp:*
--
-- 3. Endpoints de password reset funcionan:
--    POST /api/auth/request-reset-code
--    POST /api/auth/verify-reset-code
-- =====================================================
