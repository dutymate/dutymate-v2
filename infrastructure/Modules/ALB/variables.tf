variable "external_alb_certificate_arn" {
  type = string
}

variable "external_alb_health_check_path" {
  type = string
}

variable "internal_alb_health_check_path" {
  type = string
}

variable "sg_internal_alb_id" {
  type = string
}

variable "private_subnets" {
  type = list(string)
}

variable "public_subnets" {
  type = list(string)
}

variable "sg_external_alb_id" {
  type = string
}

variable "vpc_id" {
  type = string
}
