import base64
import cv2
import numpy as np

img = np.ones((480, 640, 3), dtype=np.uint8) * 255
_, buf = cv2.imencode('.jpg', img)
print(base64.b64encode(buf).decode())
