from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    userID = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    
    # Relationships
    customer = relationship("Customer", back_populates="user", uselist=False)
    admin = relationship("Admin", back_populates="user", uselist=False)

class Customer(Base):
    __tablename__ = "customers"
    studentID = Column(String, primary_key=True, index=True)
    userID = Column(Integer, ForeignKey("users.userID"))
    phoneNo = Column(String)
    
    user = relationship("User", back_populates="customer")
    requests = relationship("Request", back_populates="customer")

class Admin(Base):
    __tablename__ = "admins"
    adminID = Column(Integer, primary_key=True, index=True)
    userID = Column(Integer, ForeignKey("users.userID"))
    
    user = relationship("User", back_populates="admin")
    requests = relationship("Request", back_populates="admin")

class Parcel(Base):
    __tablename__ = "parcels"
    parcelID = Column(Integer, primary_key=True, index=True)
    lockerID = Column(Integer)  # Stored as a reference, not a FK to avoid circular dependency
    parcelPIN = Column(String)
    storageTime = Column(DateTime, default=func.now())
    hasPenalty = Column(Boolean, default=False)
    
    # Relationships
    requests = relationship("Request", back_populates="parcel")

class Request(Base):
    __tablename__ = "requests"
    requestID = Column(Integer, primary_key=True, index=True)
    studentID = Column(String, ForeignKey("customers.studentID"))
    adminID = Column(Integer, ForeignKey("admins.adminID"), nullable=True)
    parcelID = Column(Integer, ForeignKey("parcels.parcelID"), nullable=True)
    requestedParcelRef = Column(String, nullable=True)  # User-submitted parcel reference (no FK)
    requestStatus = Column(String, default="Pending")
    timestamp = Column(DateTime, default=func.now())
    approvedByAdmin = Column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="requests")
    admin = relationship("Admin", back_populates="requests")
    parcel = relationship("Parcel", back_populates="requests")

class Locker(Base):
    __tablename__ = "lockers"
    lockerID = Column(Integer, primary_key=True, index=True)
    parcelID = Column(Integer, ForeignKey("parcels.parcelID"), nullable=True)
    lockerStatus = Column(String, default="Available")
    
    # One-to-one: Locker owns the FK to Parcel
    parcel = relationship("Parcel", foreign_keys=[parcelID])
