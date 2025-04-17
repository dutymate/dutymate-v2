output "database_subnets" {
  value = [for subnet in aws_subnet.database_subnets : subnet.id]
}

output "private_subnets" {
  value = [for subnet in aws_subnet.private_subnets : subnet.id]
}

output "public_subnets" {
  value = [for subnet in aws_subnet.public_subnets : subnet.id]
}

output "vpc_id" {
  value = aws_vpc.vpc.id
}

output "vpce_s3_id" {
  value = aws_vpc_endpoint.vpce_s3.id
}
