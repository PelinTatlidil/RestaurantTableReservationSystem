/**
 * ACCESS CONTROL PROXY PATTERN
 * 
 * This utility implements the Proxy pattern to control access to sensitive data
 * and restrict operations based on user roles and resource ownership.
 * 
 * Benefits:
 * - Centralized access control logic
 * - Field-level filtering for sensitive data
 * - Role-based data exposure
 * - Protects financial and personal information
 */

/**
 * Proxy for User Data Access
 * Controls what user fields are exposed based on viewer's role
 */
class UserDataAccessProxy {
  /**
   * Filter user data based on viewer role
   * 
   * Admin can see: id, name, email, phone, role, address, university, created date
   * Customer can only see: name, role (for admins viewing their profile)
   */
  static filterUserData(user, viewerRole, viewerUserId = null) {
    if (!user) return null;

    const data = user.toObject ? user.toObject() : user;

    // Admin can see all non-sensitive fields
    if (viewerRole === 'admin') {
      const { password, ...filtered } = data;
      return filtered;
    }

    // Customer can only see their own info or limited public info
    if (viewerRole === 'customer') {
      if (viewerUserId && data._id && viewerUserId.toString() === data._id.toString()) {
        // Customer viewing own profile - can see most fields except password
        const { password, ...filtered } = data;
        return filtered;
      }
      // Customer viewing other user - restricted access
      return {
        _id: data._id,
        name: data.name,
        role: data.role,
      };
    }

    // Default: minimal exposure
    return { _id: data._id, name: data.name };
  }

  static filterUserArray(users, viewerRole, viewerUserId = null) {
    return users.map(user => this.filterUserData(user, viewerRole, viewerUserId));
  }
}

/**
 * Proxy for Reservation Data Access
 * Controls what reservation fields are exposed based on viewer role
 */
class ReservationDataAccessProxy {
  /**
   * Filter reservation data based on viewer role
   * 
   * Admin can see: All fields including financial info, customer details, audit trail
   * Customer can only see: Own reservations with limited audit info
   */
  static filterReservationData(reservation, viewerRole, viewerUserId = null, isOwner = false) {
    if (!reservation) return null;

    const data = reservation.toObject ? reservation.toObject() : reservation;

    // Admin can see everything
    if (viewerRole === 'admin') {
      return data;
    }

    // Customer can only see their own reservation
    if (viewerRole === 'customer') {
      if (!isOwner) {
        return null; // Deny access to other customer's reservations
      }

      // Return customer-friendly reservation data
      return {
        _id: data._id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        date: data.date,
        timeSlot: data.timeSlot,
        table: data.table,
        guests: data.guests,
        tablePreference: data.tablePreference,
        requests: data.requests,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    }

    return null;
  }

  static filterReservationArray(reservations, viewerRole, viewerUserId = null) {
    return reservations
      .map(res => {
        const isOwner = res.customer && viewerUserId && 
                       res.customer.toString() === viewerUserId.toString();
        return this.filterReservationData(res, viewerRole, viewerUserId, isOwner);
      })
      .filter(res => res !== null);
  }
}

/**
 * Proxy for Table Data Access
 * Controls what table configuration is exposed
 */
class TableDataAccessProxy {
  /**
   * Filter table data based on viewer role
   * 
   * Admin can see: All table details including capacity, pricing, configuration
   * Customer can see: Only basic table info (capacity, location) during booking
   */
  static filterTableData(table, viewerRole) {
    if (!table) return null;

    const data = table.toObject ? table.toObject() : table;

    // Admin can see everything
    if (viewerRole === 'admin') {
      return data;
    }

    // Customer sees limited info for booking
    if (viewerRole === 'customer') {
      return {
        _id: data._id,
        tableNumber: data.tableNumber,
        capacity: data.capacity,
        location: data.location,
        isAvailable: data.isAvailable,
      };
    }

    return null;
  }

  static filterTableArray(tables, viewerRole) {
    return tables
      .map(table => this.filterTableData(table, viewerRole))
      .filter(table => table !== null);
  }
}

/**
 * Proxy for Time Slot Data Access
 * Controls what availability data is exposed
 */
class TimeSlotDataAccessProxy {
  /**
   * Filter time slot data based on viewer role
   * 
   * Admin can see: All slots including availability, pricing
   * Customer can see: Only available slots for booking
   */
  static filterTimeSlotData(slot, viewerRole) {
    if (!slot) return null;

    const data = slot.toObject ? slot.toObject() : slot;

    // Admin can see everything
    if (viewerRole === 'admin') {
      return data;
    }

    // Customer sees only available slots
    if (viewerRole === 'customer') {
      if (!data.isAvailable) {
        return null; // Hide unavailable slots from customers
      }

      return {
        _id: data._id,
        startTime: data.startTime,
        endTime: data.endTime,
        isAvailable: data.isAvailable,
        maxCapacity: data.maxCapacity,
      };
    }

    return null;
  }

  static filterTimeSlotArray(slots, viewerRole) {
    return slots
      .map(slot => this.filterTimeSlotData(slot, viewerRole))
      .filter(slot => slot !== null);
  }
}

/**
 * Proxy for Restaurant Info Data Access
 * Controls what business data is exposed
 */
class RestaurantInfoDataAccessProxy {
  /**
   * Filter restaurant info based on viewer role
   * 
   * Admin can see: All business data including financials, policies, internal notes
   * Customer can see: Public info only (hours, address, contact, menu)
   */
  static filterRestaurantData(info, viewerRole) {
    if (!info) return null;

    const data = info.toObject ? info.toObject() : info;

    // Admin can see everything
    if (viewerRole === 'admin') {
      return data;
    }

    // Customer sees public info only
    if (viewerRole === 'customer' || viewerRole === 'guest') {
      return {
        _id: data._id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        openingHours: data.openingHours,
        description: data.description,
        // Exclude internal notes, pricing structures, and other sensitive data
      };
    }

    return null;
  }
}

/**
 * Generic Operation Access Control Proxy
 * Determines if an operation is allowed based on user role and resource ownership
 */
class OperationAccessProxy {
  /**
   * Check if user can perform an operation on a resource
   * 
   * Admin: Can perform any operation
   * Customer: Can only perform operations on their own resources
   */
  static canPerformOperation(operation, userRole, userId, resourceOwnerId) {
    // Admin can perform any operation
    if (userRole === 'admin') {
      return true;
    }

    // Customer can only operate on their own resources
    if (userRole === 'customer') {
      if (!userId || !resourceOwnerId) {
        return false;
      }
      return userId.toString() === resourceOwnerId.toString();
    }

    // No access by default
    return false;
  }

  /**
   * Get list of allowed operations for a role on a resource
   */
  static getAllowedOperations(userRole, resourceType) {
    const operations = {
      admin: {
        users: ['view', 'create', 'update', 'delete', 'export'],
        reservations: ['view', 'create', 'update', 'delete', 'export', 'updateStatus', 'cancel'],
        tables: ['view', 'create', 'update', 'delete', 'toggleAvailability'],
        timeSlots: ['view', 'create', 'update', 'delete'],
        restaurantInfo: ['view', 'update'],
      },
      customer: {
        users: ['viewOwn'],
        reservations: ['viewOwn', 'createOwn', 'updateOwn', 'cancelOwn'],
        tables: ['viewPublic'],
        timeSlots: ['viewAvailable'],
        restaurantInfo: ['view'],
      },
      guest: {
        users: [],
        reservations: [],
        tables: [],
        timeSlots: ['viewAvailable'],
        restaurantInfo: ['view'],
      },
    };

    return operations[userRole]?.[resourceType] || [];
  }
}

module.exports = {
  UserDataAccessProxy,
  ReservationDataAccessProxy,
  TableDataAccessProxy,
  TimeSlotDataAccessProxy,
  RestaurantInfoDataAccessProxy,
  OperationAccessProxy,
};
