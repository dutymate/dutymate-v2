terraform {
  backend "s3" {
    bucket         = "dutymate-terraform-state-bucket"
    key            = "terraform.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
