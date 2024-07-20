USE feral_auth;

-- do not indent the keys, whitespace in them is bad
INSERT INTO key_pairs
  (key_id, key_name, public_key, private_key, expiration)
VALUES (
'ce751d18-222a-4458-a988-b4a1340d4b2f',
'VigilantHarvestKey1',
'-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoihoN7FDlQXnROR6ovSm
hSwj3F73ePzcqX7d0WWL/lxitDO/UVG6WLyfY9T4+ougGNoVi4oYCpg/pLSOHnVV
LttKZbOMu6Ex+5SJ+Ec6OESB08b4QbBehotFKW3A2QuLmyY2vQwVOOeTIiRz+jXt
E9ggz5+ZtYmzBZVvhWDqpNjvRyl9gezRzAqBb6HOkHTzq5+a2+/Py1jIREUJe6gW
iFwpHPjXjTb7UuaqnQl9M5SJ6OyRBMDyKaZ6wJCNibvujSdh6hdNDquO+jOBIAbs
nKLF+PhT2ozNGiHAicnf1ZdRajmwzRu16f9NfEZjFWTX3zjV71o0oRr8DD0cpUV8
MwIDAQAB
-----END PUBLIC KEY-----',
'-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAoihoN7FDlQXnROR6ovSmhSwj3F73ePzcqX7d0WWL/lxitDO/
UVG6WLyfY9T4+ougGNoVi4oYCpg/pLSOHnVVLttKZbOMu6Ex+5SJ+Ec6OESB08b4
QbBehotFKW3A2QuLmyY2vQwVOOeTIiRz+jXtE9ggz5+ZtYmzBZVvhWDqpNjvRyl9
gezRzAqBb6HOkHTzq5+a2+/Py1jIREUJe6gWiFwpHPjXjTb7UuaqnQl9M5SJ6OyR
BMDyKaZ6wJCNibvujSdh6hdNDquO+jOBIAbsnKLF+PhT2ozNGiHAicnf1ZdRajmw
zRu16f9NfEZjFWTX3zjV71o0oRr8DD0cpUV8MwIDAQABAoIBABZIkznEBFOAQi23
cBrgn9mBHVR1QHDB3tjz9CuIVtqXe4Dj85CLOJ5lHUosxCI5+cAwh/FrAq7CCUzq
+vS4jwInZGvhZp+KIUI/QU57C0ccMvMVTpxITlUS4mg1CuFIsuCZOcB03p25RQDW
HZHuwyuM8cVWW1sVFyLXTEH59YS9iunroORTY/+QzL3cM6FfPdLfn15RNb9aqA8I
B7AoHFNfSUvvyLdA8AtGsK6HZUaM1HWn+nnGLjQRAqpqp5JzLEeRG0wNKSzDiOUd
OUn+eEvE1Q1Py7qHc0fVahbcKsszGV2JxL6m2iQQSvtvAvhSGIoYge9E5jnXU0+q
P11Z8qECgYEA09GuMLhqV3zuGW2Y2ptHKZ329XDoLAJs6A8jN07/yEucEgzeD2g7
W+DCUOOYN8whA756GIP8LYrcZFvqRJkARq+8UON5UjHibPyO5+TLFbNAX1X99AQT
ugGL5oJphvZfQp+dqpKs/vd9DRGa+QriLxxLJJvvSswmvcDbQklRO7kCgYEAw/sC
WtSk+iPEkBGy86+C+ZPXxM0x72Fw7H8JLx7ZLwpywPSr9e/WSqzKlX85kA0OIUxf
7vzMgBuZhBMzj1jrcljb8rD8i4zjzjsYcwy8irl72MoRQXhZ3mpfyeAVxLx8bvcX
cJWiB07+NsKBKZdMzADsU8/0Vis1s/Kmf+uxZUsCgYAI2+syJHRmJlZ6/8d11Sq7
xdyPVWKQfKV7ay6o4If4I5lqc9lRwaVB6XuXEH3MT6BN3MiUf+irKvSeye1ZYyDM
1ArHQ0xOsMFsl3+OmVYZGT8m/Zy6ePUuQWRNhsTNHT7MtYpNmQbdPxKe2k6l/duJ
5uAJru/qK/Gu3AMPmatpGQKBgQCUIy4aflXeBh9UTyyXanl0Mb6NMhWmvl7fRP8q
MQU1u44WMFuzYQD4HThcXHikXFnr7ZEuUsQ5qaMW5HS6zBncqzJGdmXPDkY74wuO
G3iA28ezjLoSZOh5aKrTK6EIvvjH39pF7bU2FQ2vUsLTL1yLb78zcyNb5vmG9cnJ
M905lQKBgQCLdArAsLR2wvwYLi1sYpnrS9MAV/efxHRpcb9UP/bntQ00jpHz9xcR
MxrArsiFPoTy4ZwunThjvHc2Wi9y2b/qGkyP02WSTkBt8OifF6oZXUjrpaJKdYTh
G2WiC0V4c7hfvruRpVIrySgzGt2+cfmTqq1EDgM1khzjpWMi1GUfLw==
-----END RSA PRIVATE KEY-----',
'2028-07-19 19:07:36');

INSERT INTO applications
  (application_id, application_name, application_url, scope, key_pair_id, mascot_asset_path)
VALUES
  ('82d7d287-978b-4df1-bc3d-526838b2465b', 'Vigilant Harvest',
  'http://localhost:5174/vigilant-harvest', 'vigilant', 'ce751d18-222a-4458-a988-b4a1340d4b2f', 'ai-owl.jpg');

