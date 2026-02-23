import React, {
    createContext,
    useContext,
    useReducer,
    ReactNode,
    Dispatch,
    useEffect,
  } from "react";
  import { db, ref, get } from "../services/firebase";
  import { getAuth, onAuthStateChanged } from "firebase/auth";
  
  // Define RoleState interface
  interface RoleState {
    department: string | null;
    isLoggedIn: boolean;
    uid: string | null;
    email: string | null;
    role: string | null; // Added role property
  }
  
  // Define action types and their payloads for role management
  interface LoginAction {
    type: "LOGIN";
    uid: string;
    email: string;
    role: string; // Add role to the action payload
    department: string; // Add role to the action payload
  }
  
  interface InitializeAction {
    type: "INITIALIZE";
    state: RoleState;
  }
  
  interface LogoutAction {
    type: "LOGOUT";
  }
  
  // Union type of all possible actions
  export type RoleAction = LoginAction | LogoutAction | InitializeAction;
  
  // Initial state for login and role
  const initialState: RoleState = {
    isLoggedIn: false,
    uid: null,
    email: null,
    role: null, // Initialize role as null
    department: null, // Initialize role as null
  };
  
  // Create RoleContext
  const RoleContext = createContext<{
    state: RoleState;
    dispatch: Dispatch<RoleAction>;
  }>({
    state: initialState,
    dispatch: () => null,
  });
  
  // Reducer function to handle state updates based on action type
  const roleReducer = (_state: RoleState, action: RoleAction): RoleState => {
    switch (action.type) {
      case "LOGIN":
        return {
          isLoggedIn: true,
          uid: action.uid,
          email: action.email,
          role: action.role, // Set the role
          department: action.department, // Set the role
        };
      case "LOGOUT":
        return initialState;
      case "INITIALIZE":
        return action.state;
      default:
        throw new Error(`Unhandled action type: ${(action as any).type}`);
    }
  };
  
  // RoleProvider component to provide context value
  export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(roleReducer, initialState);
    const [isLoading, setIsLoading] = React.useState(true);
  
    // Fetch user details (including role) from the database
    const fetchUserDetails = async (uid: string) => {
      const userRef = ref(db, `users/${uid}`);
      try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          return {
            email: userData.email || null,
            role: userData.role || "User", // Default to "User" if role is not set
          };
        } else {
          console.warn("User data not found for UID:", uid);
          return { email: null, role: "User" };
        }
      } catch (error) {
        console.error("Error fetching user data from database:", error);
        return { email: null, role: "User" };
      }
    };
  
    // Initialize state from Firebase Auth and Role
    useEffect(() => {
      const auth = getAuth();
  
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userDetails = await fetchUserDetails(user.uid);
            dispatch({
              type: "LOGIN",
              uid: user.uid,
              email: userDetails.email || user.email,
              role: userDetails.role,
              department: userDetails.role,
            });
            console.log(`Session restored for user: ${user.email}`);
          } catch (error) {
            console.error("Error restoring session:", error);
            dispatch({ type: "LOGOUT" });
          }
        } else {
          dispatch({ type: "LOGOUT" });
          console.log("No user session found.");
        }
        setIsLoading(false);
      });
  
      return () => unsubscribe(); // Cleanup listener on unmount
    }, []);
  
    // Sync state with localStorage
    useEffect(() => {
      if (!isLoading) {
        if (state.isLoggedIn) {
          localStorage.setItem("roleState", JSON.stringify(state));
          console.log(`Logged in as: ${state.email}, Role: ${state.role}`);
        } else {
          localStorage.removeItem("roleState");
          console.log("Logged out");
        }
      }
    }, [state, isLoading]);
  
    return (
      <RoleContext.Provider value={{ state, dispatch }}>
        {!isLoading && children}
      </RoleContext.Provider>
    );
  };
  
  // Custom hook to use RoleContext
  export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) {
      throw new Error("useRole must be used within a RoleProvider");
    }
    return context;
  };
