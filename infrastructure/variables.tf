variable "availability_zones" {
  type = list(string)
}

variable "aws_profile" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "database_subnet_cidr_block" {
  type = list(string)
}

variable "domain_name" {
  type = string
}

variable "external_alb_health_check_path" {
  type = string
}

variable "internal_alb_health_check_path" {
  type = string
}

variable "google_site_verification_code" {
  type = string
}

variable "mongodb_password" {
  type = string
}

variable "mongodb_username" {
  type = string
}

variable "mysql_password" {
  type = string
}

variable "mysql_username" {
  type = string
}

variable "private_subnet_cidr_block" {
  type = list(string)
}

variable "public_subnet_cidr_block" {
  type = list(string)
}

variable "route53_zone_id" {
  type = string
}

variable "vpc_cidr" {
  type = string
}
