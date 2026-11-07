-- Seed: courses that host 3D simulations, taken from the owner-supplied Academy spec §19
-- and Simulation Lab spec §4. Everything is seeded as DRAFT version 1. Nothing is published
-- by seed; publication goes through review and canPublishScenario()/course approvals.
-- Run as the migration owner (not app_rw).

INSERT INTO academy.schools (slug, name) VALUES
  ('skilled-trades', 'School of Skilled Trades'),
  ('property-management', 'School of Property Management'),
  ('property-services', 'School of Property Services');

INSERT INTO academy.courses (id, sku, slug, school_slug, title, level) VALUES
  ('crs_trades_foundations', 'HHA-ST-101', 'skilled-trades-foundations', 'skilled-trades', 'Skilled Trades Foundations', 'foundation'),
  ('crs_construction_safety', 'HHA-ST-110', 'construction-safety', 'skilled-trades', 'Construction Safety', 'foundation'),
  ('crs_carpentry_essentials', 'HHA-ST-120', 'carpentry-essentials', 'skilled-trades', 'Carpentry Essentials', 'professional'),
  ('crs_electrical_fund', 'HHA-ST-130', 'electrical-fundamentals', 'skilled-trades', 'Electrical Fundamentals', 'professional'),
  ('crs_plumbing_fund', 'HHA-ST-140', 'plumbing-fundamentals', 'skilled-trades', 'Plumbing Fundamentals', 'professional'),
  ('crs_hvac_systems', 'HHA-ST-150', 'hvac-systems', 'skilled-trades', 'HVAC Systems', 'professional'),
  ('crs_construction_mgmt', 'HHA-ST-310', 'construction-management', 'skilled-trades', 'Construction Management', 'advanced'),
  ('crs_rental_turnovers', 'HHA-PS-210', 'vacation-rental-turnovers', 'property-services', 'Vacation Rental Turnovers', 'foundation'),
  ('crs_facilities_ops', 'HHA-PS-221', 'facilities-operations', 'property-services', 'Facilities Operations', 'professional'),
  ('crs_property_ops', 'HHA-PM-220', 'property-operations', 'property-management', 'Property Operations', 'professional'),
  ('crs_build_pm_company', 'HHA-PM-320', 'building-a-property-management-company', 'property-management', 'Building a Property Management Company', 'advanced');

INSERT INTO academy.course_versions (id, course_id, version, status, price_cents) VALUES
  ('cv_trades_foundations_1', 'crs_trades_foundations', 1, 'draft', 29900),
  ('cv_construction_safety_1', 'crs_construction_safety', 1, 'draft', 39900),
  ('cv_carpentry_essentials_1', 'crs_carpentry_essentials', 1, 'draft', 59900),
  ('cv_electrical_fund_1', 'crs_electrical_fund', 1, 'draft', 69900),
  ('cv_plumbing_fund_1', 'crs_plumbing_fund', 1, 'draft', 69900),
  ('cv_hvac_systems_1', 'crs_hvac_systems', 1, 'draft', 69900),
  ('cv_construction_mgmt_1', 'crs_construction_mgmt', 1, 'draft', 89900),
  ('cv_rental_turnovers_1', 'crs_rental_turnovers', 1, 'draft', 39900),
  ('cv_facilities_ops_1', 'crs_facilities_ops', 1, 'draft', 69900),
  ('cv_property_ops_1', 'crs_property_ops', 1, 'draft', 59900),
  ('cv_build_pm_company_1', 'crs_build_pm_company', 1, 'draft', 89900);

-- Simulation lessons (kind = 'simulation'); positions are placeholders for curriculum staff to reorder.
INSERT INTO academy.lessons (id, course_version_id, position, title, lesson_kind) VALUES
  ('les_sim101', 'cv_trades_foundations_1', 10, 'SIM-101 Walk the Site', 'simulation'),
  ('les_sim102', 'cv_trades_foundations_1', 11, 'SIM-102 Tool Wall', 'simulation'),
  ('les_sim110', 'cv_construction_safety_1', 10, 'SIM-110 Hazard Hunt', 'simulation'),
  ('les_sim111', 'cv_construction_safety_1', 11, 'SIM-111 PPE Check', 'simulation'),
  ('les_sim112', 'cv_construction_safety_1', 12, 'SIM-112 Ladder and Fall Exposure', 'simulation'),
  ('les_sim113', 'cv_construction_safety_1', 13, 'SIM-113 Lockout Before Repair', 'simulation'),
  ('les_sim120', 'cv_carpentry_essentials_1', 10, 'SIM-120 Measure and Layout', 'simulation'),
  ('les_sim121', 'cv_carpentry_essentials_1', 11, 'SIM-121 Frame a Wall', 'simulation'),
  ('les_sim122', 'cv_carpentry_essentials_1', 12, 'SIM-122 Hang and Finish Drywall', 'simulation'),
  ('les_sim123', 'cv_carpentry_essentials_1', 13, 'SIM-123 Doors, Windows and Trim', 'simulation'),
  ('les_sim130', 'cv_electrical_fund_1', 10, 'SIM-130 Trace the Circuit (de-energized)', 'simulation'),
  ('les_sim140', 'cv_plumbing_fund_1', 10, 'SIM-140 Find the Leak', 'simulation'),
  ('les_sim150', 'cv_hvac_systems_1', 10, 'SIM-150 Filter, Thermostat and Airflow', 'simulation'),
  ('les_sim210', 'cv_rental_turnovers_1', 10, 'SIM-210 Unit Turnover', 'simulation'),
  ('les_sim211', 'cv_rental_turnovers_1', 11, 'SIM-211 Preventive Maintenance Rounds', 'simulation'),
  ('les_sim220', 'cv_property_ops_1', 10, 'SIM-220 Work Order Desk', 'simulation'),
  ('les_sim221', 'cv_facilities_ops_1', 10, 'SIM-221 Inspection Readiness', 'simulation'),
  ('les_sim310', 'cv_construction_mgmt_1', 10, 'SIM-310 Scope Before Demo', 'simulation'),
  ('les_sim320', 'cv_build_pm_company_1', 10, 'SIM-320 Tenant Conversations', 'simulation');

-- Honorary Homes-issued credential definitions (draft until compliance approves wording).
INSERT INTO credentials.definitions (id, kind, title, disclaimer, course_id, scenario_ids, valid_days, min_ojt_hours) VALUES
  ('HH-CC-CONST-SAFETY', 'completion_certificate', 'Certificate of Completion — Construction Safety',
   'Certificate of course completion issued by Honorary Homes Academy. Not an OSHA card, license or government credential. Does not replace site-specific safety training.',
   'crs_construction_safety', '{}', 730, NULL),
  ('HH-CC-CARP-ESS', 'completion_certificate', 'Certificate of Completion — Carpentry Essentials',
   'Certificate of course completion issued by Honorary Homes Academy. Not a license or trade certification. Hands-on skills require supervised verification.',
   'crs_carpentry_essentials', '{}', NULL, NULL),
  ('HH-SB-HAZARD-HUNT', 'sim_competency_badge', 'Simulation Competency — Hazard Recognition',
   'Simulation practice, verified by replay. Prepares for jobsite work; not a safety certification.',
   NULL, '{SIM-110,SIM-111}', 365, NULL),
  ('HH-SB-FRAMING', 'sim_competency_badge', 'Simulation Competency — Wall Framing',
   'Simulation practice, verified by replay. Prepares for supervised framing work; not a trade certification.',
   NULL, '{SIM-120,SIM-121}', NULL, NULL),
  ('HH-RFC-CARPENTRY', 'ready_for_crew', 'Ready for Crew — Carpentry',
   'Internal Honorary Homes readiness sign-off by an instructor, in person. Authorizes supervised placement on Honorary Homes crews only.',
   NULL, '{SIM-110,SIM-111,SIM-121}', 365, NULL),
  ('HH-OJT-CARP-500', 'ojt_hours_record', 'On-the-Job Learning Record — 500 Hours Carpentry',
   'Record of supervisor-verified on-the-job hours with Honorary Homes. Counts toward a Registered Apprenticeship only where a registered program and sponsor agreement apply.',
   NULL, '{}', NULL, 500);
