provider "aws" {
  region = "us-east-1"
  alias  = "virginia"
}

provider "aws" {
  region = "ap-northeast-2"
  alias  = "seoul"
}

resource "aws_acm_certificate" "cloudfront_certificate" {
  provider          = aws.virginia
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Name = "dutymate-cloudfront-certificate"
  }
}

resource "aws_acm_certificate" "external_alb_certificate" {
  provider          = aws.seoul
  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"

  tags = {
    Name = "dutymate-external-alb-certificate"
  }
}

resource "aws_route53_record" "cloudfront_route53_record" {
  for_each = { for dvo in aws_acm_certificate.cloudfront_certificate.domain_validation_options : dvo.domain_name => dvo }
  name     = each.value.resource_record_name
  type     = each.value.resource_record_type
  zone_id  = var.route53_zone_id
  records  = [each.value.resource_record_value]
  ttl      = 300
}

resource "aws_route53_record" "external_alb_route53_record" {
  for_each = { for dvo in aws_acm_certificate.external_alb_certificate.domain_validation_options : dvo.domain_name => dvo }
  name     = each.value.resource_record_name
  type     = each.value.resource_record_type
  zone_id  = var.route53_zone_id
  records  = [each.value.resource_record_value]
  ttl      = 300
}

resource "aws_acm_certificate_validation" "cloudfront_certificate_validation" {
  provider                = aws.virginia
  certificate_arn         = aws_acm_certificate.cloudfront_certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.cloudfront_route53_record : record.fqdn]
}

resource "aws_acm_certificate_validation" "external_alb_certificate_validation" {
  provider                = aws.seoul
  certificate_arn         = aws_acm_certificate.external_alb_certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.external_alb_route53_record : record.fqdn]
}
