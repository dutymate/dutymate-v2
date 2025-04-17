output "external_alb_arn" {
  value = aws_alb.external_alb.arn
}

output "external_alb_dns_name" {
  value = aws_alb.external_alb.dns_name
}

output "external_alb_zone_id" {
  value = aws_alb.external_alb.zone_id
}

output "external_alb_target_group_arn" {
  value = aws_alb_target_group.external_alb_target_group.arn
}

output "internal_alb_dns_name" {
  value = aws_alb.internal_alb.dns_name
}

output "internal_alb_target_group_arn" {
  value = aws_alb_target_group.internal_alb_target_group.arn
}
