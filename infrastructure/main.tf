module "acm" {
  source          = "./Modules/ACM"
  domain_name     = var.domain_name
  route53_zone_id = var.route53_zone_id
}

module "alb" {
  source                         = "./Modules/ALB"
  external_alb_certificate_arn   = module.acm.external_alb_certificate_arn
  external_alb_health_check_path = var.external_alb_health_check_path
  internal_alb_health_check_path = var.internal_alb_health_check_path
  private_subnets                = module.networking.private_subnets
  public_subnets                 = module.networking.public_subnets
  sg_external_alb_id             = module.security_group.sg_external_alb_id
  sg_internal_alb_id             = module.security_group.sg_internal_alb_id
  vpc_id                         = module.networking.vpc_id
}

module "cloudfront" {
  source                               = "./Modules/CloudFront"
  aws_region                           = var.aws_region
  cloudfront_certificate_arn           = module.acm.cloudfront_certificate_arn
  domain_name                          = var.domain_name
  frontend_bucket_regional_domain_name = module.s3.frontend_bucket_regional_domain_name
}

module "cloudwatch" {
  source = "./Modules/CloudWatch"
}

module "documentdb" {
  source           = "./Modules/DocumentDB"
  database_subnets = module.networking.database_subnets
  mongodb_password = var.mongodb_password
  mongodb_username = var.mongodb_username
  sg_mongodb_id    = module.security_group.sg_mongodb_id
}

module "ecr" {
  source = "./Modules/ECR"
}

module "ecs" {
  source                        = "./Modules/ECS"
  appserver_ecs_task_role_arn   = module.iam.appserver_ecs_task_role_arn
  appserver_log_group_name      = module.cloudwatch.appserver_log_group_name
  asset_bucket_arn              = module.s3.asset_bucket_arn
  aws_region                    = var.aws_region
  ecr_repository_url            = module.ecr.ecr_repository_url
  ecs_instance_profile_name     = module.iam.ecs_instance_profile_name
  ecs_service_role_arn          = module.iam.ecs_service_role_arn
  ecs_task_execution_role_arn   = module.iam.ecs_task_execution_role_arn
  external_alb_target_group_arn = module.alb.external_alb_target_group_arn
  internal_alb_dns_name         = module.alb.internal_alb_dns_name
  internal_alb_target_group_arn = module.alb.internal_alb_target_group_arn
  private_subnets               = module.networking.private_subnets
  public_subnets                = module.networking.public_subnets
  sg_appserver_ecs_id           = module.security_group.sg_appserver_ecs_id
  sg_webserver_ecs_id           = module.security_group.sg_webserver_ecs_id
  webserver_ecs_task_role_arn   = module.iam.webserver_ecs_task_role_arn
  webserver_log_group_name      = module.cloudwatch.webserver_log_group_name
}

module "elasticache" {
  source           = "./Modules/ElastiCache"
  database_subnets = module.networking.database_subnets
  sg_valkey_id     = module.security_group.sg_valkey_id
}

module "iam" {
  source = "./Modules/IAM"
}

module "networking" {
  source                     = "./Modules/Networking"
  aws_region                 = var.aws_region
  availability_zones         = var.availability_zones
  database_subnet_cidr_block = var.database_subnet_cidr_block
  private_subnet_cidr_block  = var.private_subnet_cidr_block
  public_subnet_cidr_block   = var.public_subnet_cidr_block
  sg_vpce_ecr_id             = module.security_group.sg_vpce_ecr_id
  sg_vpce_ssm_id             = module.security_group.sg_vpce_ssm_id
  vpc_cidr                   = var.vpc_cidr
}

module "rds" {
  source           = "./Modules/RDS"
  database_subnets = module.networking.database_subnets
  mysql_password   = var.mysql_password
  mysql_username   = var.mysql_username
  sg_mysql_id      = module.security_group.sg_mysql_id
}

module "route53" {
  source                                 = "./Modules/Route53"
  cloudfront_distribution_domain_name    = module.cloudfront.cloudfront_distribution_domain_name
  cloudfront_distribution_hosted_zone_id = module.cloudfront.cloudfront_distribution_hosted_zone_id
  domain_name                            = var.domain_name
  external_alb_dns_name                  = module.alb.external_alb_dns_name
  external_alb_zone_id                   = module.alb.external_alb_zone_id
  google_site_verification_code          = var.google_site_verification_code
  route53_zone_id                        = var.route53_zone_id
}

module "s3" {
  source                      = "./Modules/S3"
  cloudfront_distribution_arn = module.cloudfront.cloudfront_distribution_arn
  vpce_s3_id                  = module.networking.vpce_s3_id
}

module "security_group" {
  source                     = "./Modules/SecurityGroup"
  database_subnet_cidr_block = var.database_subnet_cidr_block
  private_subnet_cidr_block  = var.private_subnet_cidr_block
  public_subnet_cidr_block   = var.public_subnet_cidr_block
  vpc_id                     = module.networking.vpc_id
}

module "ssm" {
  source                    = "./Modules/SSM"
  database_subnets          = module.networking.database_subnets
  sg_ssm_ec2_id             = module.security_group.sg_ssm_ec2_id
  ssm_instance_profile_name = module.iam.ssm_instance_profile_name
}

module "waf" {
  source           = "./Modules/WAF"
  external_alb_arn = module.alb.external_alb_arn
}
