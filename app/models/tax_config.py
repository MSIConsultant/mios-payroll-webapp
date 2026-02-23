import uuid
from sqlalchemy import Column, String, Integer, Date
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class TaxConfig(Base):
    __tablename__ = "tax_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    version_name = Column(String, nullable=False)
    effective_from = Column(Date, nullable=False)

    ptkp_k0 = Column(Integer, nullable=False)
    ptkp_k1 = Column(Integer, nullable=False)
    ptkp_k2 = Column(Integer, nullable=False)
    ptkp_k3 = Column(Integer, nullable=False)