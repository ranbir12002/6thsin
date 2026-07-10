import os
import sys
import time
from pathlib import Path
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from dotenv import load_dotenv

def main():
    print("=" * 60)
    print("Cloudflare R2 Python Upload Test Script")
    print("=" * 60)

    # 1. Resolve path to server/.env and load it
    script_dir = Path(__file__).parent.resolve()
    env_path = script_dir.parent / '.env'

    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print(f"[+] Loaded environment variables from: {env_path}")
    else:
        # Fallback to current directory dotenv loading
        load_dotenv()
        print("[!] Warning: server/.env not found at expected path. Searching standard paths.")

    # 2. Get environment variables
    account_id = os.getenv('R2_ACCOUNT_ID')
    access_key_id = os.getenv('R2_ACCESS_KEY_ID')
    secret_access_key = os.getenv('R2_SECRET_ACCESS_KEY')
    bucket_name = os.getenv('R2_BUCKET_NAME')
    public_url = os.getenv('R2_PUBLIC_URL')

    # Validate
    missing = []
    if not account_id: missing.append('R2_ACCOUNT_ID')
    if not access_key_id: missing.append('R2_ACCESS_KEY_ID')
    if not secret_access_key: missing.append('R2_SECRET_ACCESS_KEY')
    if not bucket_name: missing.append('R2_BUCKET_NAME')

    if missing:
        print(f"[-] Error: Missing required environment variables: {', '.join(missing)}")
        print("Please check your .env file and try again.")
        sys.exit(1)

    print(f"[*] Account ID:          {account_id}")
    print(f"[*] Bucket Name:         {bucket_name}")
    print(f"[*] Access Key ID:       {access_key_id[:6]}...{access_key_id[-6:] if len(access_key_id) > 12 else ''}")
    print(f"[*] Public URL:          {public_url}")

    # 3. Create boto3 Client
    # Cloudflare R2 S3 API endpoint format:
    # https://<accountid>.r2.cloudflarestorage.com
    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
    
    print(f"[*] Connection Endpoint: {endpoint_url}")
    
    try:
        s3_client = boto3.client(
            service_name='s3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'  # Cloudflare R2 recommends 'auto'
        )
        print("[+] S3 Client initialized successfully.")
        
        # Try listing buckets to check credentials
        print("[*] Testing credentials by listing buckets...")
        try:
            buckets_resp = s3_client.list_buckets()
            print("[+] Successfully listed buckets:")
            for b in buckets_resp.get('Buckets', []):
                print(f"    - {b['Name']}")
        except Exception as list_err:
            print(f"[!] Warning: list_buckets failed: {list_err}")
            
    except Exception as e:
        print(f"[-] Failed to initialize S3 client: {e}")
        sys.exit(1)

    # 4. Prepare local test file
    test_file_name = f"test_r2_upload_{int(time.time())}.txt"
    test_file_path = script_dir / test_file_name
    test_content = f"Hello Cloudflare R2! This file was uploaded via python test script on {time.ctime()}.\n"
    
    try:
        with open(test_file_path, 'w', encoding='utf-8') as f:
            f.write(test_content)
        print(f"[+] Created local test file: {test_file_path.name}")
    except Exception as e:
        print(f"[-] Failed to create local test file: {e}")
        sys.exit(1)

    # 5. Upload file to R2
    # We will upload it into a 'test-uploads/' prefix
    object_key = f"test-uploads/{test_file_name}"
    print(f"[*] Attempting to upload to R2 bucket: {bucket_name} as '{object_key}'...")
    
    try:
        with open(test_file_path, 'rb') as f:
            file_data = f.read()
            
        s3_client.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body=file_data,
            ContentType='text/plain'
        )
        print("[+] Upload completed successfully!")
    except ClientError as e:
        print(f"[-] ClientError during upload: {e}")
        clean_local_file(test_file_path)
        sys.exit(1)
    except Exception as e:
        print(f"[-] Unexpected error during upload: {e}")
        clean_local_file(test_file_path)
        sys.exit(1)

    # 6. Verify Upload via HeadObject
    print("[*] Verifying upload by fetching object metadata from R2...")
    try:
        response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
        content_length = response.get('ContentLength', 0)
        content_type = response.get('ContentType', 'unknown')
        print(f"[+] Object verified on R2! Size: {content_length} bytes, Content-Type: {content_type}")
    except Exception as e:
        print(f"[-] Verification failed: Could not retrieve object headers from R2: {e}")

    # 7. Print Public Link if configured
    if public_url:
        # Strip trailing slash if present
        base_url = public_url.rstrip('/')
        full_public_url = f"{base_url}/{object_key}"
        print(f"\n[+] Public URL to access file: \n    {full_public_url}")
        print("    (Please note: it might take a few moments for DNS/cache or if custom domain configuration is pending.)\n")

    # 8. Clean up local test file
    clean_local_file(test_file_path)

    # 9. Offer/Perform remote cleanup
    print("[*] Cleaning up R2 bucket (deleting uploaded test file)...")
    try:
        s3_client.delete_object(Bucket=bucket_name, Key=object_key)
        print("[+] Successfully deleted test file from R2 bucket. Test completed clean!")
    except Exception as e:
        print(f"[!] Warning: Failed to delete test file '{object_key}' from R2: {e}")

    print("\n" + "=" * 60)
    print("R2 UPLOAD TEST SUCCESSFUL!")
    print("=" * 60)

def clean_local_file(filepath):
    if filepath.exists():
        try:
            filepath.unlink()
            print(f"[+] Cleaned up local test file: {filepath.name}")
        except Exception as e:
            print(f"[!] Warning: Failed to delete local test file: {e}")

if __name__ == "__main__":
    main()
