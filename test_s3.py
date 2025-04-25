import boto3

# Replace these with your actual values
AWS_ACCESS_KEY_ID = 'AKIAV5IIM3CNVI3BST7F'  # Replace with your Access Key ID
AWS_SECRET_ACCESS_KEY = 'XVwCyoGPYfI/BQPCal5+2KLdjywWKcz9baT4r9YB'  # Replace with your Secret Access Key
AWS_REGION = 'us-east-1'  # Replace with your region (e.g., 'us-east-1')
BUCKET_NAME = 'resume-tracker-dnguy'  # Replace with your bucket name

# Initialize S3 client
s3 = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

# Create a test file
with open('test.txt', 'w') as f:
    f.write('Hello, AWS S3!')

try:
    # Upload the test file
    s3.upload_file(
        'test.txt',
        BUCKET_NAME,
        'test.txt'
    )
    print("✅ Upload successful!")

    # List objects in the bucket
    print("\nContents of bucket:")
    response = s3.list_objects_v2(Bucket=BUCKET_NAME)
    for obj in response.get('Contents', []):
        print(f"- {obj['Key']}")

except Exception as e:
    print(f"❌ Error: {str(e)}") 