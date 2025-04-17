variable "database_subnet_cidr_block" {
  type = list(string)
}

variable "private_subnet_cidr_block" {
  type = list(string)
}

variable "public_subnet_cidr_block" {
  type = list(string)
}

variable "vpc_id" {
  type = string
}
