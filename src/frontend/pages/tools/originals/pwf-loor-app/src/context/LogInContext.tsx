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
  
  // Define LogInState interface
  interface LogInState {
    isLoggedIn: boolean;
    uid: string | null;
    email: string | null;
    firstName: string | null;
  }
  
  // Define action types and their payloads
  interface LoginAction {
    type: "LOGIN";
    uid: string;
    email: string;
    firstName: string;
  }
  
  interface InitializeAction {
    type: "INITIALIZE";
    state: LogInState;
  }
  
  interface LogoutAction {
    type: "LOGOUT";
  }
  
  // Union type of all possible actions
  export type LogInAction = LoginAction | LogoutAction | InitializeAction;
  
  // Initial state for login
  const initialState: LogInState = {
    isLoggedIn: false,
    uid: null,
    email: null,
    firstName: null,
  };
  
  // Create LogInContext
  const LogInContext = createContext<{
    state: LogInState;
    dispatch: Dispatch<LogInAction>;
  }>({
    state: initialState,
    dispatch: () => null,
  });
  
  // Reducer function to handle state updates based on action type
  const logInReducer = (_state: LogInState, action: LogInAction): LogInState => {
    switch (action.type) {
      case "LOGIN":
        return {
          isLoggedIn: true,
          uid: action.uid,
          email: action.email,
          firstName: action.firstName,
        };
      case "LOGOUT":
        return initialState;
      case "INITIALIZE":
        return action.state;
      default:
        throw new Error(`Unhandled action type: ${(action as any).type}`);
    }
  };
  
  // LogInProvider component to provide context value
  export const LogInProvider: React.FC<{ children: ReactNode }> = ({
    children,
  }) => {
    const [state, dispatch] = useReducer(logInReducer, initialState);
    const [isLoading, setIsLoading] = React.useState(true);
  
    // Fetch user details from the database
    const fetchUserDetails = async (uid: string) => {
      const userRef = ref(db, `users/${uid}`);
      try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          return {
            email: userData.email || null,
            firstName: userData.firstName || null,
          };
        } else {
          console.warn("User data not found for UID:", uid);
          return { email: null };
        }
      } catch (error) {
        console.error("Error fetching user data from database:", error);
        return { email: null };
      }
    };
  
    // Initialize state from Firebase Auth
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
              firstName: userDetails.firstName,
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
          localStorage.setItem("logInState", JSON.stringify(state));
          console.log(`Logged in as: ${state.email}`);
        } else {
          localStorage.removeItem("logInState");
          console.log("Logged out");
        }
      }
    }, [state, isLoading]);
  
    return (
      <LogInContext.Provider value={{ state, dispatch }}>
        {!isLoading && children}
      </LogInContext.Provider>
    );
  };
  
  // Custom hook to use LogInContext
  export const useLogIn = () => {
    const context = useContext(LogInContext);
    if (!context) {
      throw new Error("useLogIn must be used within a LogInProvider");
    }
    return context;
  };
