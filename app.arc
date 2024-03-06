@app
aws-lite-dynamodb-marshalling

@aws
# profile default
region us-west-2
architecture arm64

@tables
data
  PK *String
  SK **String
