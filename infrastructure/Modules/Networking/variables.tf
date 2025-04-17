variable "availability_zones" {
  type = list(string)
}

variable "aws_region" {
  type = string
}

variable "database_subnet_cidr_block" {
  type = list(string)
}

variable "private_subnet_cidr_block" {
  type = list(string)
}

variable "public_subnet_cidr_block" {
  type = list(string)
}

variable "sg_vpce_ecr_id" {
  type = string
}

variable "sg_vpce_ssm_id" {
  type = string
}

variable "vpc_cidr" {
  type = string
}
