resource "aws_elasticache_subnet_group" "elasticachesg" {
  name       = "dutymate-elasticachesg"
  subnet_ids = var.database_subnets

  tags = {
    Name = "dutymate-elasticachesg"
  }
}

resource "aws_elasticache_replication_group" "elasticache_replication" {
  replication_group_id       = "dutymate-elasticache"
  description                = "ElastiCache Replication Group"
  engine                     = "valkey"
  node_type                  = "cache.t2.micro"
  num_cache_clusters         = 1
  parameter_group_name       = "default.valkey7"
  engine_version             = "7.2"
  security_group_ids         = [var.sg_valkey_id]
  subnet_group_name          = aws_elasticache_subnet_group.elasticachesg.name
  automatic_failover_enabled = false

  tags = {
    Name = "dutymate-elasticache"
  }
}
