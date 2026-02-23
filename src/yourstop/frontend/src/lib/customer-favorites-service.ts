// Customer favorites service
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { customerDb, CUSTOMER_COLLECTIONS } from './firebase-customer';

export interface CustomerFavorite {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  restaurantImage?: string;
  cuisine?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFavoriteData {
  userId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  restaurantImage?: string;
  cuisine?: string;
  rating?: number;
}

class CustomerFavoritesService {
  async addFavorite(data: CreateFavoriteData): Promise<CustomerFavorite> {
    try {
      // Check if favorite already exists
      const existing = await this.getFavoriteByRestaurant(data.userId, data.restaurantId);
      if (existing) {
        return existing;
      }

      const now = new Date().toISOString();
      const favoriteData = {
        userId: data.userId,
        restaurantId: data.restaurantId,
        restaurantName: data.restaurantName,
        restaurantAddress: data.restaurantAddress || '',
        restaurantImage: data.restaurantImage || '',
        cuisine: data.cuisine || '',
        rating: data.rating || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(customerDb, CUSTOMER_COLLECTIONS.favorites),
        favoriteData
      );

      return {
        id: docRef.id,
        ...favoriteData,
        createdAt: now,
        updatedAt: now,
      } as CustomerFavorite;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw new Error('Failed to add favorite');
    }
  }

  async removeFavorite(favoriteId: string, userId: string): Promise<boolean> {
    try {
      const docRef = doc(customerDb, CUSTOMER_COLLECTIONS.favorites, favoriteId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Favorite not found');
      }

      const data = docSnap.data();
      if (data.userId !== userId) {
        throw new Error('Unauthorized access to favorite');
      }

      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  async removeFavoriteByRestaurant(userId: string, restaurantId: string): Promise<boolean> {
    try {
      const favorite = await this.getFavoriteByRestaurant(userId, restaurantId);
      if (!favorite) {
        return false;
      }

      return await this.removeFavorite(favorite.id, userId);
    } catch (error) {
      console.error('Error removing favorite by restaurant:', error);
      throw error;
    }
  }

  async getFavoriteByRestaurant(userId: string, restaurantId: string): Promise<CustomerFavorite | null> {
    try {
      const favoritesRef = collection(customerDb, CUSTOMER_COLLECTIONS.favorites);
      const q = query(
        favoritesRef,
        where('userId', '==', userId),
        where('restaurantId', '==', restaurantId)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
      } as CustomerFavorite;
    } catch (error) {
      console.error('Error getting favorite:', error);
      return null;
    }
  }

  async getUserFavorites(userId: string): Promise<CustomerFavorite[]> {
    try {
      const favoritesRef = collection(customerDb, CUSTOMER_COLLECTIONS.favorites);
      const q = query(
        favoritesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const favorites: CustomerFavorite[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        favorites.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        } as CustomerFavorite);
      });

      return favorites;
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      throw new Error('Failed to fetch favorites');
    }
  }

  async isFavorite(userId: string, restaurantId: string): Promise<boolean> {
    const favorite = await this.getFavoriteByRestaurant(userId, restaurantId);
    return favorite !== null;
  }

  async toggleFavorite(data: CreateFavoriteData): Promise<{ isFavorite: boolean; favorite?: CustomerFavorite }> {
    try {
      const existing = await this.getFavoriteByRestaurant(data.userId, data.restaurantId);
      
      if (existing) {
        await this.removeFavorite(existing.id, data.userId);
        return { isFavorite: false };
      } else {
        const favorite = await this.addFavorite(data);
        return { isFavorite: true, favorite };
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }
}

export const customerFavoritesService = new CustomerFavoritesService();

