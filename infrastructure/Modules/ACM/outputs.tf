output "external_alb_certificate_arn" {
  value = aws_acm_certificate.external_alb_certificate.arn
}

output "cloudfront_certificate_arn" {
  value = aws_acm_certificate.cloudfront_certificate.arn
}
