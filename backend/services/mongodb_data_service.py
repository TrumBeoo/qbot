from MongoDB.db import data_collection, db
from datetime import datetime
import os
import hashlib
from bson import ObjectId
import json

class MongoDBDataService:
    @staticmethod
    def get_sync_status():
        """Get synchronization status of data files"""
        try:
            # Get all files from MongoDB
            mongo_files = list(data_collection.find({"status": {"$ne": "deleted"}}))
            
            # Convert ObjectId to string for JSON serialization
            for file in mongo_files:
                if '_id' in file:
                    file['_id'] = str(file['_id'])
            
            # Get files from data directory
            data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
            local_files = []
            
            if os.path.exists(data_dir):
                for filename in os.listdir(data_dir):
                    if filename.endswith('.txt'):
                        file_path = os.path.join(data_dir, filename)
                        stat = os.stat(file_path)
                        local_files.append({
                            'filename': filename,
                            'path': file_path,
                            'size': stat.st_size,
                            'modified': stat.st_mtime
                        })
            
            # Count status
            active_files = [f for f in mongo_files if f.get('status') == 'active']
            inactive_files = [f for f in mongo_files if f.get('status') == 'inactive']
            deleted_files = [f for f in mongo_files if f.get('status') == 'deleted']
            
            # Convert datetime objects to ISO format for JSON serialization
            for file_list in [active_files, inactive_files, deleted_files]:
                for file in file_list:
                    for key, value in file.items():
                        if isinstance(value, datetime):
                            file[key] = value.isoformat()
            
            return {
                'active_files': active_files,
                'inactive_files': inactive_files,
                'deleted_files': deleted_files,
                'local_files': local_files,
                'counts': {
                    'active': len(active_files),
                    'inactive': len(inactive_files),
                    'deleted': len(deleted_files),
                    'total': len(mongo_files)
                }
            }
        except Exception as e:
            raise Exception(f"Error getting sync status: {str(e)}")
    
    @staticmethod
    def sync_file_to_mongodb(filename):
        """Sync a single file to MongoDB"""
        try:
            data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
            file_path = os.path.join(data_dir, filename)
            
            if not os.path.exists(file_path):
                return {'error': f'File {filename} not found'}
            
            # Read file content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Calculate file hash for change detection
            file_hash = hashlib.md5(content.encode('utf-8')).hexdigest()
            
            # Get file stats
            stat = os.stat(file_path)
            
            # Count lines and words
            lines = content.split('\n')
            words = content.split()
            
            # Check if file already exists in MongoDB
            existing_file = data_collection.find_one({'filename': filename})
            
            if existing_file:
                # Check if content changed
                if existing_file.get('file_hash') == file_hash:
                    return {'status': 'no_change', 'message': 'File content unchanged'}
                
                # Update existing file
                update_data = {
                    'content': content,
                    'file_hash': file_hash,
                    'file_size': stat.st_size,
                    'sync_timestamp': datetime.utcnow(),
                    'status': 'active',
                    'metadata': {
                        'line_count': len(lines),
                        'word_count': len(words),
                        'last_modified': stat.st_mtime
                    }
                }
                
                data_collection.update_one(
                    {'filename': filename},
                    {'$set': update_data}
                )
                
                return {'status': 'updated', 'message': 'File updated successfully'}
            else:
                # Create new file record
                file_data = {
                    'filename': filename,
                    'content': content,
                    'file_hash': file_hash,
                    'file_size': stat.st_size,
                    'created_at': datetime.utcnow(),
                    'sync_timestamp': datetime.utcnow(),
                    'status': 'active',
                    'metadata': {
                        'line_count': len(lines),
                        'word_count': len(words),
                        'last_modified': stat.st_mtime
                    }
                }
                
                data_collection.insert_one(file_data)
                
                return {'status': 'created', 'message': 'File created successfully'}
                
        except Exception as e:
            return {'error': f'Error syncing file: {str(e)}'}
    
    @staticmethod
    def sync_all_files():
        """Sync all files from data directory to MongoDB"""
        try:
            data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
            
            if not os.path.exists(data_dir):
                return {'error': 'Data directory not found'}
            
            results = {
                'total_files': 0,
                'successful': 0,
                'failed': 0,
                'summary': {
                    'created': 0,
                    'updated': 0,
                    'no_change': 0
                },
                'details': []
            }
            
            # Get all .txt files
            txt_files = [f for f in os.listdir(data_dir) if f.endswith('.txt')]
            results['total_files'] = len(txt_files)
            
            for filename in txt_files:
                result = MongoDBDataService.sync_file_to_mongodb(filename)
                
                if 'error' in result:
                    results['failed'] += 1
                    results['details'].append({
                        'filename': filename,
                        'status': 'error',
                        'message': result['error']
                    })
                else:
                    results['successful'] += 1
                    status = result['status']
                    results['summary'][status] += 1
                    results['details'].append({
                        'filename': filename,
                        'status': status,
                        'message': result['message']
                    })
            
            return results
            
        except Exception as e:
            return {'error': f'Error syncing all files: {str(e)}'}
    
    @staticmethod
    def force_resync():
        """Force resync - delete all data and sync again"""
        try:
            # Delete all existing data
            data_collection.delete_many({})
            
            # Sync all files
            return MongoDBDataService.sync_all_files()
            
        except Exception as e:
            return {'error': f'Error in force resync: {str(e)}'}
    
    @staticmethod
    def get_file_from_mongodb(filename):
        """Get file content from MongoDB"""
        try:
            file_doc = data_collection.find_one({'filename': filename})
            
            if not file_doc:
                return {'error': 'File not found in MongoDB'}
            
            # Convert ObjectId and datetime for JSON serialization
            if '_id' in file_doc:
                file_doc['_id'] = str(file_doc['_id'])
            
            for key, value in file_doc.items():
                if isinstance(value, datetime):
                    file_doc[key] = value.isoformat()
            
            return {
                'filename': file_doc['filename'],
                'content': file_doc['content'],
                'metadata': file_doc.get('metadata', {}),
                'sync_timestamp': file_doc.get('sync_timestamp'),
                'status': file_doc.get('status', 'unknown')
            }
            
        except Exception as e:
            return {'error': f'Error getting file from MongoDB: {str(e)}'}
    
    @staticmethod
    def delete_file_from_mongodb(filename):
        """Mark file as deleted in MongoDB"""
        try:
            result = data_collection.update_one(
                {'filename': filename},
                {'$set': {
                    'status': 'deleted',
                    'deleted_at': datetime.utcnow()
                }}
            )
            
            if result.matched_count == 0:
                return {'error': 'File not found in MongoDB'}
            
            return {'message': 'File marked as deleted successfully'}
            
        except Exception as e:
            return {'error': f'Error deleting file from MongoDB: {str(e)}'}