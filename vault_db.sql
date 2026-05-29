-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: vault_db
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `vault_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `vault_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `vault_db`;

--
-- Table structure for table `column_definitions`
--

DROP TABLE IF EXISTS `column_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `column_definitions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `field_key` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_type` enum('text','password','textarea','select','url','email','number','datetime') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `field_options` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_required` tinyint(1) DEFAULT '0',
  `is_sensitive` tinyint(1) DEFAULT '0',
  `sort_order` bigint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_field` (`product_id`,`field_key`),
  CONSTRAINT `column_definitions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `column_definitions`
--

LOCK TABLES `column_definitions` WRITE;
/*!40000 ALTER TABLE `column_definitions` DISABLE KEYS */;
INSERT INTO `column_definitions` VALUES (8,2,'host','主机地址','text','[]',1,0,1,NOW()),(9,2,'port','端口','number','[]',1,0,2,NOW()),(10,2,'db_type','数据库类型','select','[\"MySQL\",\"PostgreSQL\",\"Redis\",\"MongoDB\",\"Oracle\",\"SQL Server\",\"SQLite\"]',1,0,3,NOW()),(11,2,'database_name','数据库名','text','[]',0,0,4,NOW()),(12,2,'username','用户名','text','[]',1,0,5,NOW()),(13,2,'password','密码','password','[]',1,1,6,NOW()),(15,3,'url','网站地址','url','[]',1,0,1,NOW()),(16,3,'username','账号/邮箱','text','[]',1,0,2,NOW()),(17,3,'password','密码','password','[]',1,1,3,NOW()),(18,3,'phone','绑定手机','text','[]',0,0,4,NOW()),(19,3,'email','绑定邮箱','email','[]',0,0,5,NOW()),(20,3,'notes','备注','textarea','[]',0,0,6,NOW()),(21,4,'service','服务名称','text','[]',1,0,1,NOW()),(22,4,'api_key','API Key','password','[]',1,1,2,NOW()),(23,4,'api_secret','API Secret','password','[]',0,1,3,NOW()),(24,4,'endpoint','接入地址','url','[]',0,0,4,NOW()),(25,4,'expire_date','到期日期','text','[]',0,0,5,NOW()),(26,4,'notes','备注','textarea','[]',0,0,6,NOW()),(102,1,'ip','服务器IP','text','[]',1,0,1,NOW()),(103,1,'port','SSH端口','number','[]',0,0,2,NOW()),(104,1,'username','账号','text','[]',1,0,3,NOW()),(105,1,'password','密码','password','[]',1,1,4,NOW()),(106,1,'region','地域','select','[\"华东-上海\",\"华北-北京\",\"华南-广州\",\"华西-成都\",\"香港\",\"新加坡\",\"美国-西部\",\"美国-东部\",\"欧洲-法兰克福\",\"日本-东京\"]',0,0,5,NOW()),(107,1,'purpose','备注','text','[]',0,0,6,NOW()),(164,2,'notes','备注','textarea','[]',0,0,7,NOW()),(165,1,'standard','规格','text','[]',0,0,7,NOW()),(166,1,'owner','归属','select','[\"研发部门\",\"测试部门\",\"运维部门\"]',0,0,8,NOW()),(193,9,'address','VPN地址','url','[]',0,0,1,NOW()),(194,9,'account','账号','text','[]',0,0,2,NOW()),(195,9,'password','密码','text','[]',0,1,3,NOW());
/*!40000 ALTER TABLE `column_definitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'server',
  `color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '#6366f1',
  `sort_order` int DEFAULT '0',
  `user_id` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'服务器管理','管理所有服务器的账号密码信息','server','#6366f1',1,1,NOW(),NOW()),(2,'数据库管理','数据库连接信息管理','database','#0ea5e9',3,1,NOW(),NOW()),(3,'网站账号','各类网站和服务的登录信息','globe','#10b981',4,1,NOW(),NOW()),(4,'API密钥','第三方服务API密钥管理','key','#f59e0b',5,1,NOW(),NOW()),(9,'政务VPN管理','政务云vpn登录信息','folder','#0ea5e9',2,1,NOW(),NOW());
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rate_limit_logs`
--

DROP TABLE IF EXISTS `rate_limit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rate_limit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ip` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `path` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hit_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `is_released` tinyint(1) DEFAULT '0',
  `released_at` timestamp NULL DEFAULT NULL,
  `released_by` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `released_by` (`released_by`),
  KEY `idx_ip` (`ip`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_released` (`is_released`),
  CONSTRAINT `rate_limit_logs_ibfk_1` FOREIGN KEY (`released_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rate_limit_logs`
--

LOCK TABLES `rate_limit_logs` WRITE;
/*!40000 ALTER TABLE `rate_limit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `rate_limit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `record_values`
--

DROP TABLE IF EXISTS `record_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `record_values` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `record_id` bigint unsigned NOT NULL,
  `column_id` bigint unsigned NOT NULL,
  `field_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_encrypted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `record_id` (`record_id`),
  KEY `column_id` (`column_id`),
  CONSTRAINT `record_values_ibfk_1` FOREIGN KEY (`record_id`) REFERENCES `records` (`id`) ON DELETE CASCADE,
  CONSTRAINT `record_values_ibfk_2` FOREIGN KEY (`column_id`) REFERENCES `column_definitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `record_values`
--

LOCK TABLES `record_values` WRITE;
/*!40000 ALTER TABLE `record_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `record_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `records`
--

DROP TABLE IF EXISTS `records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `records_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `records`
--

LOCK TABLES `records` WRITE;
/*!40000 ALTER TABLE `records` DISABLE KEYS */;
/*!40000 ALTER TABLE `records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES ('allow_register','0',NOW()),('api_rate_limit_enabled','0',NOW()),('api_rate_limit_max','300',NOW()),('api_rate_limit_window_min','5',NOW()),('login_rate_limit_enabled','1',NOW()),('login_rate_limit_max','5',NOW()),('login_rate_limit_window_min','10',NOW()),('title_hidden_1','0',NOW()),('title_hidden_16','0',NOW()),('title_hidden_2','0',NOW()),('title_hidden_3','0',NOW()),('title_label_1','标题',NOW()),('title_label_16','标题12',NOW()),('title_label_2','标题',NOW()),('title_label_3','标题',NOW());
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `is_disabled` tinyint(1) DEFAULT '0',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$10$qN23rW.YV9wmXoXcOjqGZuune1BxWAm63Ic37gkUjXBJqeQWb2r4e','admin@example.com',1,0,NOW(),NOW(),NOW());
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-29 16:43:31
