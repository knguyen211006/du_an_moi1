import { doc, setDoc, getDoc, getDocs, collection, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

export { db, serverTimestamp };

// User Profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  last_name_change_at?: any; // Firestore timestamp
  createdAt?: any;
}

// Get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Lỗi khi lấy user profile:", error);
    return null;
  }
}

// Create or update user profile
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<boolean> {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(docRef, data);
    } else {
      // Create new document
      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    console.error("Lỗi khi cập nhật user profile:", error);
    return false;
  }
}

// Hàm lấy dữ liệu 1 chữ Hán (Dùng cho trang Chi tiết)
export async function getHanzi(character: string) {
  try {
    const docRef = doc(db, "hanzi", character);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu Hanzi:", error);
    return null;
  }
} 

// Hàm tìm kiếm thông minh (Đã nâng cấp lột bỏ dấu thanh điệu Pinyin)
export async function searchHanzi(searchTerm: string) {
  try {
    const querySnapshot = await getDocs(collection(db, "hanzi"));
    const allHanzi = querySnapshot.docs.map(doc => doc.data());
    
    // Hàm phụ: Lột bỏ dấu thanh điệu (Ví dụ: wǒ -> wo, ài -> ai)
    const removeTones = (str: string) => {
      if (!str) return "";
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const normalizedSearch = removeTones(searchTerm.trim());
    
    const results = allHanzi.filter((item: any) => 
      // Khớp chữ Hán chính xác
      item.hanzi === searchTerm.trim() ||
      // Khớp Pinyin đã lột dấu
      removeTones(item.pinyin).includes(normalizedSearch) ||
      // Khớp nghĩa tiếng Anh
      (item.meaning || "").toLowerCase().includes(normalizedSearch)
    );
    
    return results;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

// Hàm bơm dữ liệu (Dùng cho cái nút Seed Database)
export async function seedHanziData(dataArray: any[]) {
  try {
    console.log("Bắt đầu bơm dữ liệu...");
    const promises = dataArray.map((item) => {
      // Dùng cột 'hanzi' (ví dụ: "我") làm ID của document luôn
      const docRef = doc(db, "hanzi", item.hanzi);
      return setDoc(docRef, item);
    });
    
    await Promise.all(promises);
    console.log("Bơm dữ liệu hoàn tất!");
  } catch (error) {
    console.error("Lỗi khi bơm dữ liệu lên Firestore:", error);
    throw error; // Ném lỗi ra để page.tsx bắt được
  }
}