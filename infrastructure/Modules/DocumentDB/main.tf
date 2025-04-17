resource "aws_docdb_subnet_group" "docdbsg" {
  name       = "dutymate-docdbsg"
  subnet_ids = var.database_subnets

  tags = {
    Name = "dutymate-docdbsg"
  }
}

resource "aws_docdb_cluster" "docdb" {
  engine                          = "docdb"
  cluster_identifier              = "dutymate-docdb-cluster"
  master_username                 = var.mongodb_username
  master_password                 = var.mongodb_password
  db_subnet_group_name            = aws_docdb_subnet_group.docdbsg.id
  vpc_security_group_ids          = [var.sg_mongodb_id]
  skip_final_snapshot             = true
  storage_encrypted               = false
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.docdb_params.name

  tags = {
    Name = "dutymate-docdb-cluster"
  }
}

resource "aws_docdb_cluster_instance" "docdb_instance" {
  cluster_identifier = aws_docdb_cluster.docdb.id
  identifier         = "dutymate-docdb-instance"
  instance_class     = "db.t3.medium"
  apply_immediately  = true

  tags = {
    Name = "dutymate-docdb-instance"
  }
}

resource "aws_docdb_cluster_parameter_group" "docdb_params" {
  name   = "dutymate-docdb-params"
  family = "docdb5.0"

  parameter {
    name  = "tls"
    value = "disabled"
  }

  tags = {
    Name = "dutymate-docdb-params"
  }
}
