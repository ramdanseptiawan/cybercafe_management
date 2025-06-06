package config

import (
	"os"
	"strings"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	JWTSecret string
	JWTExpire string

	ServerPort     string
	UploadPath     string
	AllowedOrigins string
}

func Load() *Config {
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "root"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "cybercafe_db"),

		JWTSecret: getEnv("JWT_SECRET", "your-secret-key"),
		JWTExpire: getEnv("JWT_EXPIRE", "24h"),

		ServerPort:     getEnv("SERVER_PORT", "8080"),
		UploadPath:     getEnv("UPLOAD_PATH", "./uploads"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "*"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func (c *Config) GetAllowedOrigins() []string {
	return strings.Split(c.AllowedOrigins, ",")
}