const getAll: string =
  `SELECT harvest_type_id, harvest_type_name
     FROM harvest_types
    ORDER BY harvest_type_name`;

export default {
  getAll,
}
