# In-memory fallback data store for development
class InMemoryCollection:
    def __init__(self, name):
        self.name = name
        self.data = {}
        print(f"Using in-memory collection for {name}")
    
    def find_one(self, query):
        # Basic implementation to find by firebase_uid
        uid = query.get("firebase_uid")
        return self.data.get(uid)
    
    def update_one(self, query, update_data, upsert=False):
        uid = query.get("firebase_uid")
        
        # Check if user exists
        if uid in self.data:
            user_data = self.data[uid]
            
            # Handle $set operation
            if "$set" in update_data:
                for key, value in update_data["$set"].items():
                    user_data[key] = value
            
            # Handle $push operation
            if "$push" in update_data:
                for key, value in update_data["$push"].items():
                    if key not in user_data:
                        user_data[key] = []
                    user_data[key].append(value)
            
            # Handle $pull operation (for deletion)
            if "$pull" in update_data:
                for key, condition in update_data["$pull"].items():
                    if key in user_data and isinstance(user_data[key], list):
                        # Basic implementation for _id based removal
                        if "_id" in condition:
                            id_to_remove = condition["_id"]
                            user_data[key] = [item for item in user_data[key] 
                                             if item.get("_id") != id_to_remove]
            
            self.data[uid] = user_data
            return type('obj', (object,), {'modified_count': 1})
        elif upsert:
            # Create new user if upsert is True
            if "$set" in update_data:
                self.data[uid] = update_data["$set"]
            elif "$push" in update_data:
                # Initialize user with empty data and add the pushed value
                self.data[uid] = {}
                for key, value in update_data["$push"].items():
                    self.data[uid][key] = [value]
            return type('obj', (object,), {'modified_count': 1})
        else:
            return type('obj', (object,), {'modified_count': 0})
    
    def insert_one(self, document):
        uid = document.get("firebase_uid")
        if uid:
            self.data[uid] = document
            return type('obj', (object,), {'inserted_id': uid})
        return None 