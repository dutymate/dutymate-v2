output "sg_appserver_ecs_id" {
  value = aws_security_group.sg_appserver_ecs.id
}

output "sg_external_alb_id" {
  value = aws_security_group.sg_external_alb.id
}

output "sg_internal_alb_id" {
  value = aws_security_group.sg_internal_alb.id
}

output "sg_mongodb_id" {
  value = aws_security_group.sg_mongodb.id
}

output "sg_mysql_id" {
  value = aws_security_group.sg_mysql.id
}

output "sg_ssm_ec2_id" {
  value = aws_security_group.sg_ssm_ec2.id
}

output "sg_valkey_id" {
  value = aws_security_group.sg_valkey.id
}

output "sg_vpce_ecr_id" {
  value = aws_security_group.sg_vpce_ecr.id
}

output "sg_vpce_ssm_id" {
  value = aws_security_group.sg_vpce_ssm.id
}

output "sg_webserver_ecs_id" {
  value = aws_security_group.sg_webserver_ecs.id
}
