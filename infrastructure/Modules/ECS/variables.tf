variable "internal_alb_dns_name" {
  type = string
}

variable "appserver_ecs_task_role_arn" {
  type = string
}

variable "appserver_log_group_name" {
  type = string
}

variable "asset_bucket_arn" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "ecr_repository_url" {
  type = string
}

variable "ecs_instance_profile_name" {
  type = string
}

variable "ecs_service_role_arn" {
  type = string
}

variable "ecs_task_execution_role_arn" {
  type = string
}

variable "external_alb_target_group_arn" {
  type = string
}

variable "internal_alb_target_group_arn" {
  type = string
}

variable "private_subnets" {
  type = list(string)
}

variable "public_subnets" {
  type = list(string)
}

variable "sg_appserver_ecs_id" {
  type = string
}

variable "sg_webserver_ecs_id" {
  type = string
}

variable "webserver_ecs_task_role_arn" {
  type = string
}

variable "webserver_log_group_name" {
  type = string
}
