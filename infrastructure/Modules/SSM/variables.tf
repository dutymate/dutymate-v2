variable "database_subnets" {
  type = list(string)
}

variable "sg_ssm_ec2_id" {
  type = string
}

variable "ssm_instance_profile_name" {
  type = string
}
