import { forwardRef, Module } from '@nestjs/common';
import { SharedModule } from '../shared.module';
import { WebSocketTestController } from './controller/notification-ws.controller';
import { NotificationGateway } from './gateway/notification.gateway';
import { NotificationService } from './service/notification.service';

@Module({
  imports: [forwardRef(() => SharedModule)],
  controllers: [WebSocketTestController],
  providers: [NotificationGateway, NotificationService],
  exports: [NotificationGateway, NotificationService],
})
export class NotificationModule {}
