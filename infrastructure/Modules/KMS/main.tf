resource "aws_kms_key" "kms_rds_key" {
  enable_key_rotation     = true
  deletion_window_in_days = 20
}

resource "aws_kms_alias" "kms_rds_alias" {
  name          = "alias/dutymate-kms-rds"
  target_key_id = aws_kms_key.kms_rds_key.key_id
}
