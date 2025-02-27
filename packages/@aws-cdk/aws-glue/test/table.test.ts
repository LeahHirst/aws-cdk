import { Template } from '@aws-cdk/assertions';
import * as iam from '@aws-cdk/aws-iam';
import * as kms from '@aws-cdk/aws-kms';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import * as cxapi from '@aws-cdk/cx-api';
import { testFutureBehavior } from 'cdk-build-tools/lib/feature-flag';
import * as glue from '../lib';
import { CfnTable } from '../lib/glue.generated';

const s3GrantWriteCtx = { [cxapi.S3_GRANT_WRITE_WITHOUT_ACL]: true };

test('unpartitioned JSON table', () => {
  const app = new cdk.App();
  const dbStack = new cdk.Stack(app, 'db');
  const database = new glue.Database(dbStack, 'Database', {
    databaseName: 'database',
  });

  const tableStack = new cdk.Stack(app, 'table');
  const table = new glue.Table(tableStack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.UNENCRYPTED);

  Template.fromStack(tableStack).hasResource('AWS::S3::Bucket', {
    Type: 'AWS::S3::Bucket',
    DeletionPolicy: 'Retain',
    UpdateReplacePolicy: 'Retain',
  });

  Template.fromStack(tableStack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      'Fn::ImportValue': 'db:ExportsOutputRefDatabaseB269D8BB88F4B1C4',
    },
    TableInput: {
      Name: 'table',
      Description: 'table generated by CDK',
      Parameters: {
        classification: 'json',
        has_encrypted_data: false,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

});

test('partitioned JSON table', () => {
  const app = new cdk.App();
  const dbStack = new cdk.Stack(app, 'db');
  const database = new glue.Database(dbStack, 'Database', {
    databaseName: 'database',
  });

  const tableStack = new cdk.Stack(app, 'table');
  const table = new glue.Table(tableStack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    partitionKeys: [{
      name: 'year',
      type: glue.Schema.SMALL_INT,
    }],
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.UNENCRYPTED);
  expect(table.encryptionKey).toEqual(undefined);
  expect(table.bucket.encryptionKey).toEqual(undefined);

  Template.fromStack(tableStack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      'Fn::ImportValue': 'db:ExportsOutputRefDatabaseB269D8BB88F4B1C4',
    },
    TableInput: {
      Name: 'table',
      Description: 'table generated by CDK',
      Parameters: {
        classification: 'json',
        has_encrypted_data: false,
      },
      PartitionKeys: [
        {
          Name: 'year',
          Type: 'smallint',
        },
      ],
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

});

test('compressed table', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });

  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    compressed: true,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryptionKey).toEqual(undefined);
  expect(table.bucket.encryptionKey).toEqual(undefined);

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Name: 'table',
      Description: 'table generated by CDK',
      Parameters: {
        classification: 'json',
        has_encrypted_data: false,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: true,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

});

test('table.node.defaultChild', () => {
  // GIVEN
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });

  // WHEN
  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    compressed: true,
    dataFormat: glue.DataFormat.JSON,
  });

  // THEN
  expect(table.node.defaultChild instanceof CfnTable).toEqual(true);
});

test('encrypted table: SSE-S3', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });

  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.S3_MANAGED,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.S3_MANAGED);
  expect(table.encryptionKey).toEqual(undefined);
  expect(table.bucket.encryptionKey).toEqual(undefined);

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Name: 'table',
      Description: 'table generated by CDK',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        },
      ],
    },
  });

});

test('encrypted table: SSE-KMS (implicitly created key)', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });

  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.KMS,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.KMS);
  expect(table.encryptionKey).toEqual(table.bucket.encryptionKey);

  Template.fromStack(stack).hasResourceProperties('AWS::KMS::Key', {
    Description: 'Created by Default/Table/Bucket',
  });

  Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            KMSMasterKeyID: {
              'Fn::GetAtt': [
                'TableBucketKey3E9F984A',
                'Arn',
              ],
            },
            SSEAlgorithm: 'aws:kms',
          },
        },
      ],
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Name: 'table',
      Description: 'table generated by CDK',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

});

test('encrypted table: SSE-KMS (explicitly created key)', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });
  const encryptionKey = new kms.Key(stack, 'MyKey', {
    description: 'OurKey',
  });

  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.KMS,
    encryptionKey,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.KMS);
  expect(table.encryptionKey).toEqual(table.bucket.encryptionKey);
  expect(table.encryptionKey).not.toEqual(undefined);

  Template.fromStack(stack).hasResourceProperties('AWS::KMS::Key', {
    Description: 'OurKey',
  });

  Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            KMSMasterKeyID: {
              'Fn::GetAtt': [
                'MyKey6AB29FA6',
                'Arn',
              ],
            },
            SSEAlgorithm: 'aws:kms',
          },
        },
      ],
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Description: 'table generated by CDK',
      Name: 'table',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

});

test('encrypted table: SSE-KMS_MANAGED', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });

  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.KMS_MANAGED,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.KMS_MANAGED);
  expect(table.encryptionKey).toEqual(undefined);
  expect(table.bucket.encryptionKey).toEqual(undefined);

  Template.fromStack(stack).hasResourceProperties('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'aws:kms',
          },
        },
      ],
    },
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Name: 'table',
      Description: 'table generated by CDK',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

});

test('encrypted table: CSE-KMS (implicitly created key)', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });

  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.CLIENT_SIDE_KMS,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.CLIENT_SIDE_KMS);
  expect(table.encryptionKey).not.toEqual(undefined);
  expect(table.bucket.encryptionKey).toEqual(undefined);

  Template.fromStack(stack).resourceCountIs('AWS::KMS::Key', 1);

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Description: 'table generated by CDK',
      Name: 'table',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

});

test('encrypted table: CSE-KMS (explicitly created key)', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });
  const encryptionKey = new kms.Key(stack, 'MyKey', {
    description: 'MyKey',
  });

  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    encryption: glue.TableEncryption.CLIENT_SIDE_KMS,
    encryptionKey,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.CLIENT_SIDE_KMS);
  expect(table.encryptionKey).not.toEqual(undefined);
  expect(table.bucket.encryptionKey).toEqual(undefined);

  Template.fromStack(stack).hasResourceProperties('AWS::KMS::Key', {
    Description: 'MyKey',
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Description: 'table generated by CDK',
      Name: 'table',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'TableBucketDA42407C',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

});

test('encrypted table: CSE-KMS (explicitly passed bucket and key)', () => {
  const stack = new cdk.Stack();
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });
  const bucket = new s3.Bucket(stack, 'Bucket');
  const encryptionKey = new kms.Key(stack, 'MyKey', {
    description: 'MyKey',
  });

  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    bucket,
    encryption: glue.TableEncryption.CLIENT_SIDE_KMS,
    encryptionKey,
    dataFormat: glue.DataFormat.JSON,
  });
  expect(table.encryption).toEqual(glue.TableEncryption.CLIENT_SIDE_KMS);
  expect(table.encryptionKey).not.toEqual(undefined);
  expect(table.bucket.encryptionKey).toEqual(undefined);

  Template.fromStack(stack).hasResourceProperties('AWS::KMS::Key', {
    Description: 'MyKey',
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      Ref: 'DatabaseB269D8BB',
    },
    TableInput: {
      Description: 'table generated by CDK',
      Name: 'table',
      Parameters: {
        classification: 'json',
        has_encrypted_data: true,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'Bucket83908E77',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

});

test('explicit s3 bucket and prefix', () => {
  const app = new cdk.App();
  const dbStack = new cdk.Stack(app, 'db');
  const stack = new cdk.Stack(app, 'app');
  const bucket = new s3.Bucket(stack, 'ExplicitBucket');
  const database = new glue.Database(dbStack, 'Database', {
    databaseName: 'database',
  });

  new glue.Table(stack, 'Table', {
    database,
    bucket,
    s3Prefix: 'prefix/',
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    dataFormat: glue.DataFormat.JSON,
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      'Fn::ImportValue': 'db:ExportsOutputRefDatabaseB269D8BB88F4B1C4',
    },
    TableInput: {
      Description: 'table generated by CDK',
      Name: 'table',
      Parameters: {
        classification: 'json',
        has_encrypted_data: false,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'ExplicitBucket0AA51A3F',
              },
              '/prefix/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

});

test('explicit s3 bucket and with empty prefix', () => {
  const app = new cdk.App();
  const dbStack = new cdk.Stack(app, 'db');
  const stack = new cdk.Stack(app, 'app');
  const bucket = new s3.Bucket(stack, 'ExplicitBucket');
  const database = new glue.Database(dbStack, 'Database', {
    databaseName: 'database',
  });

  new glue.Table(stack, 'Table', {
    database,
    bucket,
    s3Prefix: '',
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    dataFormat: glue.DataFormat.JSON,
  });

  Template.fromStack(stack).hasResourceProperties('AWS::Glue::Table', {
    CatalogId: {
      Ref: 'AWS::AccountId',
    },
    DatabaseName: {
      'Fn::ImportValue': 'db:ExportsOutputRefDatabaseB269D8BB88F4B1C4',
    },
    TableInput: {
      Description: 'table generated by CDK',
      Name: 'table',
      Parameters: {
        classification: 'json',
        has_encrypted_data: false,
      },
      StorageDescriptor: {
        Columns: [
          {
            Name: 'col',
            Type: 'string',
          },
        ],
        Compressed: false,
        InputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
        Location: {
          'Fn::Join': [
            '',
            [
              's3://',
              {
                Ref: 'ExplicitBucket0AA51A3F',
              },
              '/',
            ],
          ],
        },
        OutputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
        SerdeInfo: {
          SerializationLibrary: 'org.openx.data.jsonserde.JsonSerDe',
        },
        StoredAsSubDirectories: false,
      },
      TableType: 'EXTERNAL_TABLE',
    },
  });

});

test('grants: read only', () => {
  const stack = new cdk.Stack();
  const user = new iam.User(stack, 'User');
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });

  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    compressed: true,
    dataFormat: glue.DataFormat.JSON,
  });

  table.grantRead(user);

  Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: [
        {
          Action: [
            'glue:BatchDeletePartition',
            'glue:BatchGetPartition',
            'glue:GetPartition',
            'glue:GetPartitions',
            'glue:GetTable',
            'glue:GetTables',
            'glue:GetTableVersion',
            'glue:GetTableVersions',
          ],
          Effect: 'Allow',
          Resource: {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':glue:',
                {
                  Ref: 'AWS::Region',
                },
                ':',
                {
                  Ref: 'AWS::AccountId',
                },
                ':table/',
                {
                  Ref: 'DatabaseB269D8BB',
                },
                '/',
                {
                  Ref: 'Table4C2D914F',
                },
              ],
            ],
          },
        },
        {
          Action: [
            's3:GetObject*',
            's3:GetBucket*',
            's3:List*',
          ],
          Effect: 'Allow',
          Resource: [
            {
              'Fn::GetAtt': [
                'TableBucketDA42407C',
                'Arn',
              ],
            },
            {
              'Fn::Join': [
                '',
                [
                  {
                    'Fn::GetAtt': [
                      'TableBucketDA42407C',
                      'Arn',
                    ],
                  },
                  '/*',
                ],
              ],
            },
          ],
        },
      ],
      Version: '2012-10-17',
    },
    PolicyName: 'UserDefaultPolicy1F97781E',
    Users: [
      {
        Ref: 'User00B015A1',
      },
    ],
  });

});

testFutureBehavior('grants: write only', s3GrantWriteCtx, cdk.App, (app) => {
  const stack = new cdk.Stack(app);
  const user = new iam.User(stack, 'User');
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });

  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    compressed: true,
    dataFormat: glue.DataFormat.JSON,
  });

  table.grantWrite(user);

  Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: [
        {
          Action: [
            'glue:BatchCreatePartition',
            'glue:BatchDeletePartition',
            'glue:CreatePartition',
            'glue:DeletePartition',
            'glue:UpdatePartition',
          ],
          Effect: 'Allow',
          Resource: {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':glue:',
                {
                  Ref: 'AWS::Region',
                },
                ':',
                {
                  Ref: 'AWS::AccountId',
                },
                ':table/',
                {
                  Ref: 'DatabaseB269D8BB',
                },
                '/',
                {
                  Ref: 'Table4C2D914F',
                },
              ],
            ],
          },
        },
        {
          Action: [
            's3:DeleteObject*',
            's3:PutObject',
            's3:Abort*',
          ],
          Effect: 'Allow',
          Resource: [
            {
              'Fn::GetAtt': [
                'TableBucketDA42407C',
                'Arn',
              ],
            },
            {
              'Fn::Join': [
                '',
                [
                  {
                    'Fn::GetAtt': [
                      'TableBucketDA42407C',
                      'Arn',
                    ],
                  },
                  '/*',
                ],
              ],
            },
          ],
        },
      ],
      Version: '2012-10-17',
    },
    PolicyName: 'UserDefaultPolicy1F97781E',
    Users: [
      {
        Ref: 'User00B015A1',
      },
    ],
  });

});

testFutureBehavior('grants: read and write', s3GrantWriteCtx, cdk.App, (app) => {
  const stack = new cdk.Stack(app);
  const user = new iam.User(stack, 'User');
  const database = new glue.Database(stack, 'Database', {
    databaseName: 'database',
  });

  const table = new glue.Table(stack, 'Table', {
    database,
    tableName: 'table',
    columns: [{
      name: 'col',
      type: glue.Schema.STRING,
    }],
    compressed: true,
    dataFormat: glue.DataFormat.JSON,
  });

  table.grantReadWrite(user);

  Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: [
        {
          Action: [
            'glue:BatchDeletePartition',
            'glue:BatchGetPartition',
            'glue:GetPartition',
            'glue:GetPartitions',
            'glue:GetTable',
            'glue:GetTables',
            'glue:GetTableVersion',
            'glue:GetTableVersions',
            'glue:BatchCreatePartition',
            'glue:CreatePartition',
            'glue:DeletePartition',
            'glue:UpdatePartition',
          ],
          Effect: 'Allow',
          Resource: {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':glue:',
                {
                  Ref: 'AWS::Region',
                },
                ':',
                {
                  Ref: 'AWS::AccountId',
                },
                ':table/',
                {
                  Ref: 'DatabaseB269D8BB',
                },
                '/',
                {
                  Ref: 'Table4C2D914F',
                },
              ],
            ],
          },
        },
        {
          Action: [
            's3:GetObject*',
            's3:GetBucket*',
            's3:List*',
            's3:DeleteObject*',
            's3:PutObject',
            's3:Abort*',
          ],
          Effect: 'Allow',
          Resource: [
            {
              'Fn::GetAtt': [
                'TableBucketDA42407C',
                'Arn',
              ],
            },
            {
              'Fn::Join': [
                '',
                [
                  {
                    'Fn::GetAtt': [
                      'TableBucketDA42407C',
                      'Arn',
                    ],
                  },
                  '/*',
                ],
              ],
            },
          ],
        },
      ],
      Version: '2012-10-17',
    },
    PolicyName: 'UserDefaultPolicy1F97781E',
    Users: [
      {
        Ref: 'User00B015A1',
      },
    ],
  });

});

test('validate: at least one column', () => {
  expect(() => {
    createTable({
      columns: [],
      tableName: 'name',
    });
  }).toThrowError('you must specify at least one column for the table');

});

test('validate: unique column names', () => {
  expect(() => {
    createTable({
      tableName: 'name',
      columns: [{
        name: 'col1',
        type: glue.Schema.STRING,
      }, {
        name: 'col1',
        type: glue.Schema.STRING,
      }],
    });
  }).toThrowError("column names and partition keys must be unique, but 'col1' is duplicated");

});

test('validate: unique partition keys', () => {
  expect(() => {
    createTable({
      tableName: 'name',
      columns: [{
        name: 'col1',
        type: glue.Schema.STRING,
      }],
      partitionKeys: [{
        name: 'p1',
        type: glue.Schema.STRING,
      }, {
        name: 'p1',
        type: glue.Schema.STRING,
      }],
    });
  }).toThrowError("column names and partition keys must be unique, but 'p1' is duplicated");

});

test('validate: column names and partition keys are all unique', () => {
  expect(() => {
    createTable({
      tableName: 'name',
      columns: [{
        name: 'col1',
        type: glue.Schema.STRING,
      }],
      partitionKeys: [{
        name: 'col1',
        type: glue.Schema.STRING,
      }],
    });
  }).toThrowError("column names and partition keys must be unique, but 'col1' is duplicated");

});

test('validate: can not specify an explicit bucket and encryption', () => {
  expect(() => {
    createTable({
      tableName: 'name',
      columns: [{
        name: 'col1',
        type: glue.Schema.STRING,
      }],
      bucket: new s3.Bucket(new cdk.Stack(), 'Bucket'),
      encryption: glue.TableEncryption.KMS,
    });
  }).toThrowError('you can not specify encryption settings if you also provide a bucket');
});

test('validate: can explicitly pass bucket if Encryption undefined', () => {
  expect(() => createTable({
    tableName: 'name',
    columns: [{
      name: 'col1',
      type: glue.Schema.STRING,
    }],
    bucket: new s3.Bucket(new cdk.Stack(), 'Bucket'),
    encryption: undefined,
  })).not.toThrow();
});

test('validate: can explicitly pass bucket if Unencrypted', () => {
  expect(() => createTable({
    tableName: 'name',
    columns: [{
      name: 'col1',
      type: glue.Schema.STRING,
    }],
    bucket: new s3.Bucket(new cdk.Stack(), 'Bucket'),
    encryption: undefined,
  })).not.toThrow();
});

test('validate: can explicitly pass bucket if ClientSideKms', () => {
  expect(() => createTable({
    tableName: 'name',
    columns: [{
      name: 'col1',
      type: glue.Schema.STRING,
    }],
    bucket: new s3.Bucket(new cdk.Stack(), 'Bucket'),
    encryption: glue.TableEncryption.CLIENT_SIDE_KMS,
  })).not.toThrow();
});

test('Table.fromTableArn', () => {
  // GIVEN
  const stack = new cdk.Stack();

  // WHEN
  const table = glue.Table.fromTableArn(stack, 'boom', 'arn:aws:glue:us-east-1:123456789012:table/db1/tbl1');

  // THEN
  expect(table.tableArn).toEqual('arn:aws:glue:us-east-1:123456789012:table/db1/tbl1');
  expect(table.tableName).toEqual('tbl1');
});

function createTable(props: Pick<glue.TableProps, Exclude<keyof glue.TableProps, 'database' | 'dataFormat'>>): void {
  const stack = new cdk.Stack();
  new glue.Table(stack, 'table', {
    ...props,
    database: new glue.Database(stack, 'db', {
      databaseName: 'database_name',
    }),
    dataFormat: glue.DataFormat.JSON,
  });
}
