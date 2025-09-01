#!/usr/bin/env python3
"""
Script to fix user data in the database
"""

from db import users_collection

def fix_user_data():
    """Fix user data issues"""
    print("Fixing user data...")
    
    # Update users with missing provider information
    result = users_collection.update_many(
        {'provider': None},
        {'$set': {'provider': 'email'}}
    )
    print(f'Updated {result.modified_count} users with missing provider')
    
    # Update users with None password to have a provider of 'google' if they have google_id
    result = users_collection.update_many(
        {'password': None, 'google_id': {'$exists': True}},
        {'$set': {'provider': 'google'}}
    )
    print(f'Updated {result.modified_count} users to google provider')
    
    # Check the updated data
    print("\nCurrent user data:")
    users = list(users_collection.find({}, {'email': 1, 'password': 1, 'provider': 1, 'google_id': 1}))
    for user in users:
        print(f'Email: {user.get("email")}')
        print(f'Provider: {user.get("provider")}')
        print(f'Has Password: {user.get("password") is not None}')
        print(f'Has Google ID: {user.get("google_id") is not None}')
        print('---')

if __name__ == "__main__":
    fix_user_data()