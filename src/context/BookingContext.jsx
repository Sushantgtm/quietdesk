import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeSeatAvailability, updateSeatStatusInFirestore, updateSeatDetailsInFirestore, createSeatInFirestore, deleteSeatInFirestore } from '../services/firebase/seatService';
import { subscribeBookings, createBooking as createBookingService, updateBookingStatus, confirmBooking as confirmBookingService, updateBookingPaymentStatus, updateBookingDetails as updateBookingDetailsService } from '../services/firebase/bookingService';
import { subscribePlans, createPlan as createPlanService, updatePlan as updatePlanService, deletePlan as deletePlanService } from '../services/firebase/pricingService';
import { subscribeUsers, createUser as createUserService, updateUser as updateUserService } from '../services/firebase/userService';
import { subscribeAmenities } from '../services/firebase/amenityService';
import { subscribeBranchInfo } from '../services/firebase/branchService';
import { subscribeZones, createZoneInFirestore, updateZoneInFirestore, deleteZoneInFirestore, getLocalZones } from '../services/firebase/zoneService';
import { ACCESS_PLANS, MOCK_SEATS } from '../services/mock/mockData';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [seats, setSeats] = useState(MOCK_SEATS);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState(ACCESS_PLANS);
  const [amenities, setAmenities] = useState([]);
  const [zones, setZones] = useState([]);
  const [branchInfo, setBranchInfo] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Subscribe to all real-time Firestore collections
  useEffect(() => {
    const unsubSeats = subscribeSeatAvailability((updatedSeats) => {
      setSeats(updatedSeats);
      setLoading(false);
    });

    const unsubBookings = subscribeBookings((updatedBookings) => {
      setBookings(updatedBookings);
      setLoadingBookings(false);
    });

    const unsubUsers = subscribeUsers((updatedUsers) => {
      setUsers(updatedUsers);
      setLoadingUsers(false);
    });

    const unsubPlans = subscribePlans((updatedPlans) => {
      setPlans(updatedPlans);
    });

    const unsubAmenities = subscribeAmenities((updatedAmenities) => {
      setAmenities(updatedAmenities);
    });

    const unsubBranch = subscribeBranchInfo((updatedBranch) => {
      setBranchInfo(updatedBranch);
    });

    const unsubZones = subscribeZones((updatedZones) => {
      setZones(updatedZones);
    });

    return () => {
      unsubSeats();
      unsubBookings();
      unsubUsers();
      unsubPlans();
      unsubAmenities();
      if (typeof unsubBranch === 'function') unsubBranch();
      if (typeof unsubZones === 'function') unsubZones();
    };
  }, []);

  const selectSeat = (seat) => {
    setSelectedSeat(seat);
  };

  const selectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  // Zone Management
  const createZone = async (zoneData) => {
    const newZone = await createZoneInFirestore(zoneData);
    if (newZone) {
      setZones(prev => {
        const exists = prev.some(z => z.id === newZone.id);
        if (exists) {
          return prev.map(z => z.id === newZone.id ? newZone : z);
        }
        return [...prev, newZone];
      });
    }
    return newZone;
  };

  const updateZoneDetails = async (zoneId, updatedFields) => {
    const res = await updateZoneInFirestore(zoneId, updatedFields);
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, ...updatedFields } : z));
    return res;
  };

  const deleteZone = async (zoneId) => {
    const res = await deleteZoneInFirestore(zoneId);
    setZones(prev => prev.filter(z => z.id !== zoneId));
    return res;
  };

  const changeSeatStatus = async (seatId, newStatus) => {
    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, status: newStatus } : s));
    await updateSeatStatusInFirestore(seatId, newStatus);
  };

  const createSeat = async (seatData) => {
    const newSeat = await createSeatInFirestore(seatData);
    if (newSeat) {
      setSeats(prev => {
        const exists = prev.some(s => s.id === newSeat.id);
        if (exists) return prev.map(s => s.id === newSeat.id ? newSeat : s);
        return [...prev, newSeat];
      });
    }
    return newSeat;
  };

  const updateSeatDetails = async (seatId, updatedFields) => {
    const res = await updateSeatDetailsInFirestore(seatId, updatedFields);
    setSeats(prev => prev.map(s => s.id === seatId ? { ...s, ...updatedFields } : s));
    return res;
  };

  const deleteSeat = async (seatId) => {
    const res = await deleteSeatInFirestore(seatId);
    setSeats(prev => prev.filter(s => s.id !== seatId));
    return res;
  };

  const createBooking = async (bookingData) => {
    const newBooking = await createBookingService(bookingData);
    return newBooking;
  };

  const changeBookingStatus = async (bookingId, seatId, newStatus) => {
    await updateBookingStatus(bookingId, seatId, newStatus);
    if ((newStatus === 'COMPLETED' || newStatus === 'CANCELLED') && seatId) {
      await changeSeatStatus(seatId, 'AVAILABLE');
    }
  };

  const changePaymentStatus = async (bookingId, newPaymentStatus) => {
    await updateBookingPaymentStatus(bookingId, newPaymentStatus);
  };

  const updateBookingDetails = async (bookingId, updatedFields) => {
    return await updateBookingDetailsService(bookingId, updatedFields);
  };

  // Admin-only: confirm a pending user reservation
  const confirmBooking = async (bookingId, seatId) => {
    await confirmBookingService(bookingId, seatId);
  };

  // User Management
  const createUser = async (userData) => {
    return await createUserService(userData);
  };

  const updateUser = async (userId, updatedFields) => {
    return await updateUserService(userId, updatedFields);
  };

  // Package / Pricing Management
  const createPlan = async (planData) => {
    return await createPlanService(planData);
  };

  const updatePlan = async (planId, updatedFields) => {
    return await updatePlanService(planId, updatedFields);
  };

  const deletePlan = async (planId) => {
    return await deletePlanService(planId);
  };

  return (
    <BookingContext.Provider
      value={{
        seats,
        bookings,
        users,
        plans,
        amenities,
        zones,
        branchInfo,
        selectedSeat,
        selectedPlan,
        loading,
        loadingBookings,
        loadingUsers,
        selectSeat,
        selectPlan,
        changeSeatStatus,
        createSeat,
        updateSeatDetails,
        deleteSeat,
        createZone,
        updateZoneDetails,
        deleteZone,
        createBooking,
        changeBookingStatus,
        changePaymentStatus,
        updateBookingDetails,
        confirmBooking,
        createUser,
        updateUser,
        createPlan,
        updatePlan,
        deletePlan
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);


